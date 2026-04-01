from pydantic import BaseModel, EmailStr
from datetime import date, datetime
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
    
    # 时空因果推断增强字段
    rhinitis_type: Optional[str] = None
    diagnosed_date: Optional[date] = None
    family_history: Optional[bool] = False
    has_asthma: Optional[bool] = False
    has_eczema: Optional[bool] = False
    known_allergens: Optional[str] = None
    occupation: Optional[str] = None
    smoking_status: Optional[str] = None
    residence_type: Optional[str] = None
    preferred_ai_model: Optional[str] = "gemini-2.5-pro"

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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    aqi: Optional[int] = None
    allergens_info: Optional[str] = None
    
    # 时空因果推断增强字段: 详细污染物与气象
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    co: Optional[float] = None
    so2: Optional[float] = None
    precipitation: Optional[float] = None
    pressure: Optional[float] = None
    wind_speed: Optional[float] = None
    env_data_source: Optional[str] = None
    
    # 室内环境与暴露 (Indoor Environment)
    pet_contact: Optional[bool] = False
    indoor_ventilation: Optional[int] = 5
    indoor_dust: Optional[int] = 5
    
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

class LoginAudit(BaseModel):
    id: int
    email: str
    success: bool
    ip_address: Optional[str] = None
    timestamp: datetime
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True
