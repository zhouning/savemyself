# models_enhanced.py - 增强版数据模型 (Phase 1实施方案)
"""
这是对现有models.py的增强版本，采用最小侵入式设计。
实施时可以通过数据库迁移逐步添加这些字段。
"""

from sqlalchemy import Boolean, Column, Integer, String, Date, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "savemyself_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(Date, nullable=False)

    # 权限与控制
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # ===== 原有字段 =====
    rhinitis_years = Column(Integer, default=0)
    primary_symptoms = Column(String, nullable=True)

    # ===== 新增字段 (Phase 1) =====
    # 鼻炎分类
    rhinitis_type = Column(String, nullable=True)  # "季节性", "常年性", "混合型"
    diagnosed_date = Column(Date, nullable=True)

    # 家族史与共病
    family_history = Column(Boolean, default=False)
    has_asthma = Column(Boolean, default=False)
    has_eczema = Column(Boolean, default=False)
    has_conjunctivitis = Column(Boolean, default=False)

    # 已知过敏原 (JSON格式字符串)
    known_allergens = Column(Text, nullable=True)  # 例: '["尘螨", "花粉", "猫毛"]'

    # 社会经济因素
    occupation = Column(String, nullable=True)
    smoking_status = Column(String, nullable=True)  # "从不", "曾经", "当前"
    residence_type = Column(String, nullable=True)  # "城市", "郊区", "农村"

    logs = relationship("DailyLog", back_populates="owner")


class DailyLog(Base):
    __tablename__ = "savemyself_daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("savemyself_users.id"), index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)

    # ===== 原有字段 =====
    # 症状
    nasal_congestion = Column(Integer, default=0)
    runny_nose = Column(Integer, default=0)
    sneezing = Column(Integer, default=0)
    itchiness = Column(Integer, default=0)

    # 基础环境
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    aqi = Column(Integer, nullable=True)
    allergens_info = Column(String, nullable=True)

    # 生活方式
    sleep_quality = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)
    exercise_minutes = Column(Integer, default=0)
    diet_notes = Column(Text, nullable=True)

    # 干预措施
    medications = Column(Text, nullable=True)
    nasal_wash = Column(Boolean, default=False)
    other_treatments = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # ===== 新增字段 (Phase 1 - 环境污染物详细) =====
    pm25 = Column(Float, nullable=True)
    pm10 = Column(Float, nullable=True)
    no2 = Column(Float, nullable=True)
    o3 = Column(Float, nullable=True)
    co = Column(Float, nullable=True)
    so2 = Column(Float, nullable=True)

    # 气象详细
    precipitation = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)

    # 过敏原详细
    pollen_count = Column(Integer, nullable=True)
    pollen_type = Column(String, nullable=True)
    mold_spores = Column(Integer, nullable=True)

    # 室内环境
    indoor_humidity = Column(Float, nullable=True)
    indoor_ventilation = Column(Integer, nullable=True)
    pet_contact = Column(Boolean, default=False)
    dust_exposure = Column(Integer, nullable=True)

    # 生活质量 (QoL)
    qol_sleep_disruption = Column(Integer, nullable=True)
    qol_work_impact = Column(Integer, nullable=True)
    qol_social_impact = Column(Integer, nullable=True)
    qol_mood = Column(Integer, nullable=True)

    # 干预效果追踪
    medication_effectiveness = Column(Integer, nullable=True)
    treatment_adherence = Column(Integer, nullable=True)

    # 数据来源标记
    env_data_source = Column(String, nullable=True)  # "qweather", "openweathermap"
    env_fetched_at = Column(DateTime, nullable=True)

    owner = relationship("User", back_populates="logs")
