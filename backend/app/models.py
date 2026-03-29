from sqlalchemy import Boolean, Column, Integer, String, Date, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "savemyself_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(Date, nullable=False)
    
    # 权限与控制
    is_active = Column(Boolean, default=True) # 控制账号是否可以继续使用 (如防止消耗token)
    is_admin = Column(Boolean, default=False) # 控制是否有管理员权限
    
    # 用户的基本画像信息，有助于AI分析
    rhinitis_years = Column(Integer, default=0) # 患病年限
    primary_symptoms = Column(String, nullable=True) # 主要症状标签

    logs = relationship("DailyLog", back_populates="owner")

class DailyLog(Base):
    __tablename__ = "savemyself_daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("savemyself_users.id"), index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    
    # 症状 Symptoms (建议使用 0-10 的评分制)
    nasal_congestion = Column(Integer, default=0) # 鼻塞程度
    runny_nose = Column(Integer, default=0)       # 流涕程度
    sneezing = Column(Integer, default=0)         # 打喷嚏频率
    itchiness = Column(Integer, default=0)        # 眼鼻发痒程度
    
    # 环境 Environment (后续可以接第三方天气API自动获取，目前手动记录)
    temperature = Column(Float, nullable=True)    # 气温
    humidity = Column(Float, nullable=True)       # 湿度 (%)
    latitude = Column(Float, nullable=True)       # 纬度 (用户定位)
    longitude = Column(Float, nullable=True)      # 经度 (用户定位)
    aqi = Column(Integer, nullable=True)          # 空气质量指数
    allergens_info = Column(String, nullable=True)# 过敏原信息 (如"花粉高", "尘螨高")
    
    # 生活方式 Lifestyle
    sleep_quality = Column(Integer, nullable=True) # 睡眠质量 (0-10)
    stress_level = Column(Integer, nullable=True)  # 压力水平 (0-10)
    exercise_minutes = Column(Integer, default=0)  # 运动时长 (分钟)
    diet_notes = Column(Text, nullable=True)       # 饮食记录 (如"吃了辛辣","喝了冰水","牛奶")
    
    # 干预措施 Interventions (你尝试的治疗方案)
    medications = Column(Text, nullable=True)      # 用药记录 (如"布地奈德喷剂", "氯雷他定")
    nasal_wash = Column(Boolean, default=False)    # 今天是否洗鼻
    other_treatments = Column(Text, nullable=True) # 其他疗法 (如"艾灸", "中药偏方", "盐水热敷")
    
    # 备注 Notes (其他任何你觉得相关的感受)
    notes = Column(Text, nullable=True)

    owner = relationship("User", back_populates="logs")

