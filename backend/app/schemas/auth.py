from pydantic import BaseModel, EmailStr, Field

# Input: Dữ liệu lúc Đăng Ký
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

# Input: Dữ liệu lúc Đăng Nhập
class UserLogin(BaseModel):
    username: str
    password: str

# Output: Dữ liệu User trả về (Tuyệt đối không trả về password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        orm_mode = True

# Output: Token trả về
class Token(BaseModel):
    access_token: str
    token_type: str