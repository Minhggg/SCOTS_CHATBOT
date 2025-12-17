from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    # Sau này có thể thêm history: List[str]

class ChatResponse(BaseModel):
    response: str