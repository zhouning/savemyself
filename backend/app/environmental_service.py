# environmental_service.py - 环境数据自动采集服务
"""
自动从第三方API获取环境数据并填充到DailyLog
支持: 和风天气API (中国) + OpenWeatherMap (全球备用)
"""

import httpx
from datetime import date, datetime
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class EnvironmentalDataService:
    """环境数据采集服务"""

    def __init__(self, qweather_key: str, openweather_key: str):
        self.qweather_key = qweather_key
        self.openweather_key = openweather_key
        self.qweather_base = "https://devapi.qweather.com/v7"
        self.openweather_base = "https://api.openweathermap.org/data/2.5"

    async def fetch_all_data(
        self, latitude: float, longitude: float, log_date: date
    ) -> Dict:
        """
        获取完整的环境数据
        优先使用和风天气(中国),失败则回退到OpenWeatherMap
        """
        try:
            # 判断是否在中国境内 (简化判断)
            if 18 <= latitude <= 54 and 73 <= longitude <= 135:
                return await self._fetch_qweather(latitude, longitude)
            else:
                return await self._fetch_openweather(latitude, longitude)
        except Exception as e:
            logger.error(f"环境数据获取失败: {e}")
            return {}

    async def _fetch_qweather(self, lat: float, lon: float) -> Dict:
        """和风天气API"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            location = f"{lon},{lat}"

            # 实时天气
            weather_resp = await client.get(
                f"{self.qweather_base}/weather/now",
                params={"location": location, "key": self.qweather_key},
            )
            weather_resp.raise_for_status()
            weather = weather_resp.json()["now"]

            # 空气质量
            air_resp = await client.get(
                f"{self.qweather_base}/air/now",
                params={"location": location, "key": self.qweather_key},
            )
            air_resp.raise_for_status()
            air = air_resp.json()["now"]

            return {
                # 气象
                "temperature": float(weather["temp"]),
                "humidity": float(weather["humidity"]),
                "pressure": float(weather["pressure"]),
                "wind_speed": float(weather["windSpeed"]),
                "precipitation": float(weather.get("precip", 0)),
                # 空气质量
                "aqi": int(air["aqi"]),
                "pm25": float(air["pm2p5"]),
                "pm10": float(air["pm10"]),
                "no2": float(air["no2"]),
                "o3": float(air["o3"]),
                "co": float(air["co"]),
                "so2": float(air["so2"]),
                # 元数据
                "env_data_source": "qweather",
                "env_fetched_at": datetime.utcnow(),
            }

    async def _fetch_openweather(self, lat: float, lon: float) -> Dict:
        """OpenWeatherMap API (备用)"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 天气数据
            weather_resp = await client.get(
                f"{self.openweather_base}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.openweather_key,
                    "units": "metric",
                },
            )
            weather_resp.raise_for_status()
            weather = weather_resp.json()

            # 空气质量
            air_resp = await client.get(
                f"{self.openweather_base}/air_pollution",
                params={"lat": lat, "lon": lon, "appid": self.openweather_key},
            )
            air_resp.raise_for_status()
            air = air_resp.json()["list"][0]

            return {
                # 气象
                "temperature": float(weather["main"]["temp"]),
                "humidity": float(weather["main"]["humidity"]),
                "pressure": float(weather["main"]["pressure"]),
                "wind_speed": float(weather["wind"]["speed"]),
                # 空气质量
                "aqi": int(air["main"]["aqi"]) * 50,  # 转换为中国AQI标准
                "pm25": float(air["components"]["pm2_5"]),
                "pm10": float(air["components"]["pm10"]),
                "no2": float(air["components"]["no2"]),
                "o3": float(air["components"]["o3"]),
                "co": float(air["components"]["co"]) / 1000,  # 转换为mg/m³
                "so2": float(air["components"]["so2"]),
                # 元数据
                "env_data_source": "openweathermap",
                "env_fetched_at": datetime.utcnow(),
            }


# 在FastAPI路由中使用
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import DailyLog
from .config import settings

router = APIRouter()
env_service = EnvironmentalDataService(
    qweather_key=settings.qweather_api_key,
    openweather_key=settings.openweather_api_key,
)


@router.post("/api/logs/create")
async def create_daily_log(
    log_data: dict,  # 简化,实际应使用Pydantic schema
    db: Session = Depends(get_db),
):
    """
    创建日志并自动填充环境数据
    """
    # 自动获取环境数据
    if log_data.get("latitude") and log_data.get("longitude"):
        env_data = await env_service.fetch_all_data(
            latitude=log_data["latitude"],
            longitude=log_data["longitude"],
            log_date=log_data["date"],
        )
        # 合并到日志数据
        log_data.update(env_data)

    # 创建日志
    log = DailyLog(**log_data)
    db.add(log)
    db.commit()
    db.refresh(log)

    return {"status": "success", "log_id": log.id, "env_auto_filled": bool(env_data)}
