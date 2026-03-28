from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserBase(BaseModel):
    email: EmailStr
    rhinitis_years: Optional[int] = 0
    primary_symptoms: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: date

    class Config:
        from_attributes = True

class DailyLogBase(BaseModel):
    date: date
    
    nasal_congestion: Optional[int] = 0
    runny_nose: Optional[int] = 0
    sneezing: Optional[int] = 0
    itchiness: Optional[int] = 0
    
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    aqi: Optional[int] = None
    allergens_info: Optional[str] = None
    
    sleep_quality: Optional[int] = None
    stress_level: Optional[int] = None
    exercise_minutes: Optional[int] = 0
    diet_notes: Optional[str] = None
    
    medications: Optional[str] = None
    nasal_wash: Optional[bool] = False
    other_treatments: Optional[str] = None
    
    notes: Optional[str] = None

class DailyLogCreate(DailyLogBase):
    pass

class DailyLog(DailyLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
