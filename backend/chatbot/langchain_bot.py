from langchain.chat_models import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
import os

llm = ChatOpenAI(temperature=0.5, model_name="gpt-3.5-turbo", openai_api_key=os.getenv("OPENAI_API_KEY"))

def get_chat_response(query: str, history: list[str]):
    messages = [SystemMessage(content="""
You are KrishiGPT – an agricultural assistant designed to help Indian farmers.
Respond in simple Hindi or Marathi depending on user’s input language.
Use local context like Maharashtra, Kharif/Rabi crops, rainfall, soil issues, etc.
""")]
    
    # Add previous conversation if any
    for i, msg in enumerate(history):
        if i % 2 == 0:
            messages.append(HumanMessage(content=msg))
        else:
            messages.append(AIMessage(content=msg))

    messages.append(HumanMessage(content=query))
    
    response = llm(messages)
    return response.content
