from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
import time

router = APIRouter()

@router.post("/message", response_model=ChatResponse)
async def chat_handler(request: ChatRequest):
    # --- LOGIC XỬ LÝ AI Ở ĐÂY ---
    # Ví dụ: Gọi OpenAI API, LangChain, hoặc Gemini API
    
    user_msg = request.message
    
    # Giả lập xử lý (Mocking)
    fake_ai_response = f"Backend FastAPI đã nhận được: '{user_msg}'. Đây là logic xử lý tách biệt."
    
    # Simulate delay
    # import asyncio; await asyncio.sleep(1)
    
    return ChatResponse(response=fake_ai_response)