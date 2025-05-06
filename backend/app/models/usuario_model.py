from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserDB(BaseModel):
    email: EmailStr
    hashed_password: str

class UserUpdatePassword(BaseModel):
    new_password: str = Field(min_length=6)

class UserPublic(BaseModel):
    email: EmailStr
