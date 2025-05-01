import sys
sys.stdout.reconfigure(encoding='utf-8')

from fastapi import FastAPI, File, UploadFile, Form, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import shutil
import os
import uuid
import requests
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient
from mandi_rates import fetch_mandi_data

from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Roboflow setup
client = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)
WORKSPACE_NAME = "agrisaarthi"
project_versions = {
    "tomato": "custom-workflow-4",
    "potato": "custom-workflow-3",
    "onion": "custom-workflow-2"
}

# FastAPI App
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/diagnose")
async def diagnose_crop(
    image: UploadFile = File(...),
    symptoms: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    crop: Optional[str] = Form("tomato")
):
    try:
        temp_filename = f"temp_{uuid.uuid4().hex}_{image.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        model_slug = project_versions.get(crop.lower())
        if not model_slug:
            return JSONResponse(status_code=400, content={"error": f"No model available for crop: {crop}"})

        result = client.run_workflow(
            workspace_name=WORKSPACE_NAME,
            workflow_id=model_slug,
            images={"image": temp_filename},
            use_cache=True
        )

        os.remove(temp_filename)

        outer = result[0].get("predictions", {})
        inner = outer.get("predictions", [])
        prediction = inner[0] if inner else {}

        crop_disease = prediction.get("class")
        confidence = prediction.get("confidence")

        if not crop_disease:
            return {
                "diagnosis": "Diagnosis: Could not detect disease.",
                "confidence": None,
                "language": language,
                "symptoms": symptoms
            }

        # ✅ Prompt with table format
        prompt = (
           f"You are an expert crop advisor. A farmer's crop has this disease: {crop_disease}.\n\n"
           "- Give a detailed remedy including:\n"
           "  1. Specific chemical/pesticide names (e.g., Mancozeb, Copper Oxychloride)\n"
           "  2. Quantity to use and frequency (e.g., weekly for 2 weeks)\n"
           "  3. Brand name examples (e.g., Indofil M-45)\n"
           "  4. Estimated cost range in INR (per acre)\n"
           "- Also include: Watering advice, recovery time, and prevention tips\n\n"
           "Use simple farmer-friendly language. Present data in bullet points or tables if useful."
        )



        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AgriSaarthi-Diagnosis",
            "Content-Type": "application/json"
        }

        data = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 1200
        }

        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        res.raise_for_status()
        remedy = res.json()["choices"][0]["message"]["content"]

        # ✅ Translate entire diagnosis + remedy if needed
        if language in ["hi", "mr"]:
            translate_prompt = (
                f"Translate this into {'Hindi' if language == 'hi' else 'Marathi'}:\n\n"
                f"Diagnosis: {crop_disease}\n\nRemedy:\n{remedy}"
            )
            translation_data = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": translate_prompt}],
                "temperature": 0.5
            }
            translation_res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=translation_data)
            translation_res.raise_for_status()
            translated = translation_res.json()["choices"][0]["message"]["content"]

            return {
                "diagnosis": translated,
                "confidence": confidence,
                "language": language,
                "symptoms": symptoms
            }

        return {
            "diagnosis": f"Diagnosis: {crop_disease}\n\nRemedy:\n{remedy}",
            "confidence": confidence,
            "language": language,
            "symptoms": symptoms
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Diagnosis failed: {str(e)}"})


# ✅ KRISHIGPT endpoint
@app.post("/krishigpt")
async def krishigpt_chat(request: Request):
    try:
        body = await request.json()
        query = body.get("query")
        language = body.get("language", "en")

        if not query:
            return {"response": "No query provided."}

        prompt = (
            f"You are a helpful agricultural expert. Answer the following question for a farmer "
            f"in { 'Marathi' if language == 'mr' else 'Hindi' if language == 'hi' else 'English' }:\n\n"
            f"{query.strip()}\n\n"
            f"Answer only in { 'Marathi' if language == 'mr' else 'Hindi' if language == 'hi' else 'English' }."
        )

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AgriSaarthi-KrishiGPT",
            "Content-Type": "application/json"
        }

        data = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }

        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        res.raise_for_status()

        reply = res.json()["choices"][0]["message"]["content"]

        return {"response": reply.strip()}

    except Exception as e:
        return JSONResponse(status_code=500, content={"response": f"KrishiGPT failed: {str(e)}"})


# ✅ MANDI RATES endpoint
@app.get("/mandi-rates")
async def mandi_rates(state: Optional[str] = None, district: Optional[str] = None, commodity: Optional[str] = None):
    try:
        data = fetch_mandi_data(state=state, district=district, commodity=commodity)
        sorted_data = sorted(
            data,
            key=lambda x: x.get("arrival_date", ""),
            reverse=True
        )
        return {"records": sorted_data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ✅ PRICE TREND PREDICTION endpoint
@app.get("/predict-price-trend")
async def predict_price_trend(state: str, market: str, commodity: str):
    try:
        # Fetch mandi data
        data = fetch_mandi_data(state=state, commodity=commodity)
        df = pd.DataFrame(data)

        # Filter only for that mandi
        df = df[df["market"] == market]

        if df.empty:
            return JSONResponse(status_code=400, content={"error": "No data available."})

        df["arrival_date"] = pd.to_datetime(df["arrival_date"], errors="coerce")
        df = df.dropna(subset=["arrival_date", "modal_price"])

        if df.empty:
            return JSONResponse(status_code=400, content={"error": "Invalid data."})

        df = df.sort_values("arrival_date")
        df["days"] = (df["arrival_date"] - df["arrival_date"].min()).dt.days
        X = df[["days"]]
        y = df["modal_price"].astype(float)

        model = LinearRegression()
        model.fit(X, y)

        last_day = df["days"].max()
        future_days = np.array([last_day + i for i in range(1, 4)]).reshape(-1, 1)
        future_prices = model.predict(future_days)

        history = df[["arrival_date", "modal_price"]].tail(15)
        prediction = []

        start_date = df["arrival_date"].max()
        for i, price in enumerate(future_prices):
            predict_date = start_date + timedelta(days=i + 1)
            prediction.append({
                "arrival_date": predict_date.strftime("%Y-%m-%d"),
                "modal_price": round(price, 2)
            })

        return {
            "history": history.to_dict(orient="records"),
            "prediction": prediction
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})



@app.post("/fertilizer-advice")
async def fertilizer_advice(request: Request):
    try:
        body = await request.json()
        crop = body.get("crop")
        soil_ph = body.get("soil_ph")
        crop_age = body.get("crop_age")
        weather = body.get("weather")
        language = body.get("language", "en")

        if not crop or not soil_ph or not weather:
            return {"error": "Missing inputs."}

        # Prompt for English
        prompt = (
            f"Suggest best fertilizer for a {crop} crop with soil pH {soil_ph} "
            f"and current weather condition '{weather}'. Crop age: {crop_age} months. "
            "List fertilizer name, quantity recommendation per acre, brand options and tips."
        )

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }

        # 🔥 First get response in English
        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        res.raise_for_status()
        english_output = res.json()["choices"][0]["message"]["content"]

        # 🔥 If selected language is not English, translate
        translated_output = english_output
        if language in ["hi", "mr"]:
            translate_prompt = (
                f"Translate this agricultural advice into {'Hindi' if language == 'hi' else 'Marathi'}:\n\n{english_output}"
            )
            translation_data = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": translate_prompt}],
                "temperature": 0.5
            }
            translation_res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=translation_data)
            translation_res.raise_for_status()
            translated_output = translation_res.json()["choices"][0]["message"]["content"]

        # ✅ Now return both translated output + english backup
        return {
            "ai_advice": translated_output,  # Hindi/Marathi if needed
            "english_version": english_output  # Always English
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
# Add this at the very end of your existing main.py

@app.post("/generate-calendar")
async def generate_calendar(request: Request):
    try:
        body = await request.json()
        crop = body.get("crop")
        sowingDate = body.get("sowingDate")
        soilType = body.get("soilType")
        farmSize = body.get("farmSize")
        location = body.get("location")
        language = body.get("language", "en")

        if not crop or not sowingDate or not soilType or not farmSize or not location:
            return {"error": "Missing inputs."}

        prompt = (
    f"You are an agricultural expert helping a farmer. Generate a farming schedule for the following crop: {crop}. "
    f"Sowing Date: {sowingDate}, Soil Type: {soilType}, Farm Size: {farmSize} acre(s), Location: {location}. "
    f"Schedule should include watering, fertilizer application, pest control, weed management, and harvest prediction. "
    f"👉 Important: Always keep dates in English format like 'May 1, 2025' even if the description is in Hindi/Marathi. "
    f"👉 Now write the activity descriptions in {'Hindi' if language == 'hi' else 'Marathi' if language == 'mr' else 'English'} simple language for farmers. "
    f"Each line must start with the Date, followed by the activity description."
)


        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": os.getenv("OPENROUTER_MODEL"),  # 🛠️ fixed this line to use your .env
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.6
        }

        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        res.raise_for_status()

        reply = res.json()["choices"][0]["message"]["content"]

        return {"calendar": reply.strip()}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Calendar generation failed: {str(e)}"})
@app.post("/upload-crop-photo")
async def upload_crop_photo(image: UploadFile = File(...)):
    try:
        temp_filename = f"temp_{uuid.uuid4().hex}_{image.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        prompt = (
            f"You are an expert agricultural AI. "
            f"Analyze the uploaded crop image and determine its growth stage. "
            f"Answer in one word only: Early, Vegetative, Flowering, Fruiting, Harvest."
        )

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": os.getenv("OPENROUTER_MODEL"),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5
        }

        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        res.raise_for_status()
        reply = res.json()["choices"][0]["message"]["content"]

        os.remove(temp_filename)

        return {"growth_stage": reply.strip()}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Image analysis failed: {str(e)}"})
