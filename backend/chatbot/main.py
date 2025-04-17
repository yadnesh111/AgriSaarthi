from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from langchain_bot import get_chat_response
from pydantic import BaseModel

app = FastAPI()

# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    history: list[str] = []

@app.post("/chat")
async def chat(req: ChatRequest):
    response = get_chat_response(req.query, req.history)
    return {"response": response}
