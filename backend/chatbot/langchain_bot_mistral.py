import os
import requests
from dotenv import load_dotenv


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env")) # Load API key from .env file
def get_chat_response(query: str, history: list):
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",  #  model from OpenRouter
        "messages": [
            {"role": "system", "content": "You are a helpful agriculture assistant that answers in Hindi or Marathi."},
            {"role": "user", "content": query}
        ],
        "temperature": 0.7
    }

    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)

    if response.status_code != 200:
        print("Error:", response.status_code, response.text)
        response.raise_for_status()

    result = response.json()
    return result["choices"][0]["message"]["content"]