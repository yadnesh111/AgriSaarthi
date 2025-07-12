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
import feedparser
from datetime import datetime, timedelta
import re

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

@app.get("/")
async def root():
    return {"message": "✅ AgriSaarthi backend is up and running!"}

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
            "HTTP-Referer": "https://agrisaarthi.vercel.app",
            "X-Title": "AgriSaarthi-Diagnosis",
            "Content-Type": "application/json"
        }

        data = {
            "model": "anthropic/claude-3-haiku",
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
                "model": "anthropic/claude-3-haiku",
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
            "HTTP-Referer": "https://agrisaarthi.vercel.app",
            "X-Title": "AgriSaarthi-KrishiGPT",
            "Content-Type": "application/json"
        }

        data = {
            "model": "anthropic/claude-3-haiku",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }

        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        print("Status code:", res.status_code)
        print("Response text:", res.text)
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
            "model": "meta-llama/llama-3-8b-instruct",
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
                "model": "anthropic/claude-3-haiku",
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

...

@app.post("/generate-calendar")
async def generate_calendar(request: Request):
    try:
        from datetime import datetime
        import traceback

        body = await request.json()
        crop = body.get("crop")
        sowingDate = body.get("sowingDate")
        soilType = body.get("soilType")
        farmSize = body.get("farmSize")
        location = body.get("location")
        language = body.get("language", "en")

        if not all([crop, sowingDate, soilType, farmSize, location]):
            return JSONResponse(status_code=400, content={"error": "Missing inputs."})

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://agrisaarthi.vercel.app",  # change accordingly
            "Content-Type": "application/json"
        }

        # Step 1: Predict total duration
        duration_prompt = (
            f"You are an agricultural AI expert. The crop is '{crop}', grown on {farmSize} acre(s) of {soilType} soil in {location}, "
            f"sowing date is {sowingDate}. Predict total days from sowing to harvest for this crop. Reply only with a number like '95'."
        )

        try:
            duration_data = {
                "model": "anthropic/claude-3-haiku",
                "messages": [{"role": "user", "content": duration_prompt}],
                "temperature": 0.4
            }

            duration_res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=duration_data)
            duration_res.raise_for_status()
            duration_json = duration_res.json()
            print("Duration API response:", duration_json)
            duration_text = duration_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            total_days = int("".join(filter(str.isdigit, duration_text))) or 100
        except Exception as e:
            print("⚠️ Claude Duration Error:", e)
            traceback.print_exc()
            total_days = 100  # fallback

        # Step 2: Generate full calendar
        full_schedule_prompt = (
            f"You are an agricultural assistant helping a farmer generate a detailed {total_days}-day calendar for crop '{crop}'. "
            f"The sowing date is {sowingDate}, soil type is {soilType}, farm size is {farmSize} acres, and location is {location}. "
            f"Create a day-wise farming activity schedule (watering, fertilizing, pesticide, growth stages, harvesting, etc). "
            f"Start from {sowingDate} for about {total_days} days. Use simple language in {'Marathi' if language=='mr' else 'Hindi' if language=='hi' else 'English'}. "
            f"Start each line with a date like 'July 21, 2025: [activity]', no bullets."
        )

        ai_data = {
            "model": "anthropic/claude-3-haiku",
            "messages": [{"role": "user", "content": full_schedule_prompt}],
            "temperature": 0.7
        }

        try:
            ai_res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=ai_data)
            ai_res.raise_for_status()
            ai_json = ai_res.json()
            print("AI Calendar API response:", ai_json)
            full_calendar_text = ai_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        except Exception as e:
            print("⚠️ AI Calendar Generation Error:", e)
            traceback.print_exc()
            full_calendar_text = "Error generating calendar."

        print("✅ Full AI Calendar Generated:\n", full_calendar_text)
        return {"calendar": full_calendar_text}

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Calendar generation failed: {str(e)}"})




AGRI_RSS_FEEDS = [
    "https://agrifarming.in/feed",
    "https://justagriculture.in/feed"
]

def get_ai_summary(prompt: str):
    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "anthropic/claude-3-haiku",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.6
            }
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print("AI summarization failed:", e)
        return "⚠️ AI summary unavailable."

@app.get("/news")
def get_agriculture_news(district: Optional[str] = None):
    cutoff = datetime.now() - timedelta(days=90)
    articles = []

    for url in AGRI_RSS_FEEDS:
        feed = feedparser.parse(url)
        count = 0
        for entry in feed.entries:
            if count >= 8:
                break
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub = datetime(*entry.published_parsed[:6])
                if pub < cutoff:
                    continue
            else:
                continue

            clean_summary = re.sub(r'<[^>]+>', '', entry.summary)
            ai_summary = get_ai_summary(f"Summarize this agriculture article for Indian farmers:\n\n{clean_summary}")

            articles.append({
                "title": entry.title,
                "summary": ai_summary.strip(),
                "url": entry.link,
                "published": pub.isoformat()
            })
            count += 1

    # Add local news if district provided
    if district:
        local = get_ai_summary(f"Write a short 1-paragraph agriculture update or news for {district}, India. It could include weather, crop alerts, farmer schemes, etc.")
        articles.insert(0, {
            "title": f"📍 Trending in {district}",
            "summary": local.strip(),
            "url": "",
            "published": datetime.now().isoformat()
        })

    return {"articles": articles}


YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

@app.get("/reels")
def get_reels():
    url = (
        f"https://www.googleapis.com/youtube/v3/search?part=snippet&q=agriculture+farming&type=video&videoDuration=short&maxResults=10&key={YOUTUBE_API_KEY}"
    )
    response = requests.get(url)
    data = response.json()
    reels = []

    for item in data.get("items", []):
        reels.append({
            "title": item["snippet"]["title"],
            "description": item["snippet"]["description"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "videoId": item["id"]["videoId"]
        })

    return {"reels": reels}
