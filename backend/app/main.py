from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel

from . import models, schemas, ai_engine, auth
from .database import engine, get_db
from .config import settings

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SaveMyself API", 
    description="鼻炎治愈AI探索系统 - v1.0 (Multi-User SaaS)"
)

# -----------------
# 真正的安全与认证
# -----------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """验证 JWT Token 并获取当前用户对象"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    """获取当前处于激活状态的用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="该账户已被停用")
    return current_user

def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)):
    """获取当前管理员用户"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user

# -----------------
# 用户认证 API
# -----------------
@app.post("/token", response_model=schemas.Token, tags=["认证"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=schemas.User, tags=["用户管理"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """注册新用户"""
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        created_at=datetime.now().date(),
        rhinitis_years=user.rhinitis_years,
        primary_symptoms=user.primary_symptoms,
        is_active=True,
        is_admin=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/me", response_model=schemas.User, tags=["用户管理"])
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    """获取当前登录用户信息"""
    return current_user

# -----------------
# 管理员 API
# -----------------
class UserStatusUpdate(BaseModel):
    is_active: bool

@app.get("/admin/users", response_model=List[schemas.User], tags=["后台管理"])
def read_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """(Admin) 获取所有用户列表"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.put("/admin/users/{user_id}/status", response_model=schemas.User, tags=["后台管理"])
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """(Admin) 启用/停用特定用户"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = status_data.is_active
    db.commit()
    db.refresh(user)
    return user

# -----------------
# 打卡记录 API
# -----------------
@app.post("/logs", response_model=schemas.DailyLog, tags=["每日打卡"])
def create_log(
    log: schemas.DailyLogCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """记录当前用户的新一天数据，如果存在则更新"""
    db_log = db.query(models.DailyLog).filter(
        models.DailyLog.date == log.date,
        models.DailyLog.user_id == current_user.id
    ).first()
    
    if db_log:
        for key, value in log.model_dump().items():
            setattr(db_log, key, value)
        db.commit()
        db.refresh(db_log)
        return db_log
    
    new_log = models.DailyLog(**log.model_dump(), user_id=current_user.id)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@app.get("/logs/{log_date}", response_model=schemas.DailyLog, tags=["每日打卡"])
def read_log_by_date(
    log_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """根据日期获取特定一天的打卡记录"""
    db_log = db.query(models.DailyLog).filter(
        models.DailyLog.date == log_date,
        models.DailyLog.user_id == current_user.id
    ).first()
    if db_log is None:
        raise HTTPException(status_code=404, detail="未找到该日期的记录。")
    return db_log

@app.get("/logs", response_model=List[schemas.DailyLog], tags=["每日打卡"])
def read_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """获取当前用户的历史打卡记录"""
    logs = db.query(models.DailyLog)\
        .filter(models.DailyLog.user_id == current_user.id)\
        .order_by(models.DailyLog.date.desc())\
        .offset(skip).limit(limit).all()
    return logs

# -----------------
# Data Agent 导出 API
# -----------------
from typing import Optional
@app.get("/export/logs", tags=["数据导出与因果推断"])
def export_logs(
    target_user_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """导出鼻炎日志数据 (支持 Data Agent 连接器)"""
    
    # 权限检查
    if target_user_id and target_user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="无权访问其他用户数据")

    # 查询数据
    query = db.query(models.DailyLog)
    
    if target_user_id:
        query = query.filter(models.DailyLog.user_id == target_user_id)
    elif not current_user.is_admin:
        # 普通用户只能导出自己的
        query = query.filter(models.DailyLog.user_id == current_user.id)
        
    if start_date:
        query = query.filter(models.DailyLog.date >= start_date)
    if end_date:
        query = query.filter(models.DailyLog.date <= end_date)

    logs = query.all()

    # 简单脱敏转换，准备给因果分析用
    export_data = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_hash": hash(str(log.user_id)), # 简单哈希脱敏
            "date": str(log.date),
            "nasal_congestion": log.nasal_congestion,
            "runny_nose": log.runny_nose,
            "sneezing": log.sneezing,
            "itchiness": log.itchiness,
            "temperature": log.temperature,
            "humidity": log.humidity,
            "latitude": log.latitude,  # 注意：在真实的严格环境中可以对经纬度加随机噪声偏移
            "longitude": log.longitude,
            "aqi": log.aqi,
            "pm25": log.pm25,
            "pm10": log.pm10,
            "no2": log.no2,
            "o3": log.o3,
            "co": log.co,
            "so2": log.so2,
            "precipitation": log.precipitation,
            "pressure": log.pressure,
            "wind_speed": log.wind_speed,
            "sleep_quality": log.sleep_quality,
            "stress_level": log.stress_level,
            "exercise_minutes": log.exercise_minutes,
            "nasal_wash": log.nasal_wash,
            "medications": log.medications
        }
        export_data.append(log_dict)

    return export_data

# -----------------
# AI 引擎 API
# -----------------
@app.get("/ai/analyze", tags=["AI 分析与决策引擎"])
def get_ai_analysis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """触发 AI 引擎，分析当前用户的打卡数据并生成个性化建议"""
    analysis_result = ai_engine.analyze_logs(db, user_id=current_user.id)
    return {"status": "success", "analysis": analysis_result}

