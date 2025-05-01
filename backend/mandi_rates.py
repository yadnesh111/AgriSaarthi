# ✅ backend/mandi_rates.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY")
BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

def fetch_mandi_data(state=None, district=None, commodity=None):
    params = {
        "api-key": DATA_GOV_API_KEY,
        "format": "json",
        "limit": 100,
    }
    if state:
        params["filters[state]"] = state
    if district:
        params["filters[district]"] = district
    if commodity:
        params["filters[commodity]"] = commodity

    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()
    data = response.json()

    return data.get("records", [])
