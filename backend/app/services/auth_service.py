from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserRegister):
    # 1. Logic kiểm tra trùng lặp
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username đã tồn tại")
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    
    # 2. Logic tạo user mới
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, user_login: UserLogin):
    # 1. Tìm user
    user = get_user_by_username(db, user_login.username)
    if not user:
        return None
    # 2. Check pass
    if not verify_password(user_login.password, user.hashed_password):
        return None
    return user