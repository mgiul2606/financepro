# app/schemas/auth.py
from backend.app.schemas.base import CamelCaseModel
from pydantic import EmailStr, Field
from uuid import UUID

class UserRegister(CamelCaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=50)

class UserLogin(CamelCaseModel):
    email: EmailStr
    password: str

class Token(CamelCaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(CamelCaseModel):
    user_id: UUID
    email: str