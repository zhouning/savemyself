import google.generativeai as genai
from sqlalchemy.orm import Session
from . import models
from .config import settings
from typing import List
import json

# 配置 Gemini API
genai.configure(api_key=settings.gemini_api_key)

def analyze_logs(db: Session, user_id: int) -> str:
    """
    获取指定用户的最近打卡记录，并调用 Gemini 寻找关联性
    """
    if not settings.gemini_api_key:
        return "请在环境变量中配置 GEMINI_API_KEY 以启用 AI 分析功能。"

    # 获取用户的基本画像
    user = db.query(models.User).filter(models.User.id == user_id).first()
    user_info = ""
    if user:
        user_info = f"患病年限：{user.rhinitis_years}年。主要症状：{user.primary_symptoms}。"

    # 仅获取当前用户的记录
    logs = db.query(models.DailyLog)\
        .filter(models.DailyLog.user_id == user_id)\
        .order_by(models.DailyLog.date.desc())\
        .limit(30).all()
    
    if len(logs) < 5:
        return "数据量不足，请至少积累 5 天的打卡数据后再进行 AI 分析。"

    # 将日志数据格式化为文本
    log_data = []
    for log in logs:
        log_dict = {
            "date": str(log.date),
            "symptoms": {
                "nasal_congestion": log.nasal_congestion,
                "runny_nose": log.runny_nose,
                "sneezing": log.sneezing,
                "itchiness": log.itchiness
            },
            "environment": {
                "temperature": log.temperature,
                "humidity": log.humidity,
                "aqi": log.aqi,
                "allergens": log.allergens_info
            },
            "lifestyle": {
                "sleep_quality": log.sleep_quality,
                "stress_level": log.stress_level,
                "diet": log.diet_notes
            },
            "interventions": {
                "medications": log.medications,
                "nasal_wash": log.nasal_wash,
                "others": log.other_treatments
            },
            "notes": log.notes
        }
        log_data.append(log_dict)

    prompt = f"""
你现在是一位专业的耳鼻喉科医学数据分析师。
以下是一位慢性鼻炎患者（{user_info}）最近的日常打卡数据（JSON格式）。

你的任务是仔细分析这些数据，寻找“症状（symptoms）”波动与“环境（environment）”、“生活方式（lifestyle）”、“干预措施（interventions）”之间的潜在关联（Triggers 和 Relievers）。

请给出：
1. **数据洞察**：你发现了哪些相关性？（例如：高湿度、喝牛奶是否会导致症状加重？洗鼻、某类药物是否显著减轻了症状？）
2. **潜在诱发因素**：列出可能的 Trigger。
3. **下一步建议**：基于数据，建议患者在接下来的几天尝试调整什么变量（如停止吃某种食物、坚持洗鼻等），以供进一步验证。

注意：语言请保持客观、严谨，并提醒这仅仅是基于有限数据的统计相关性分析，而非专业医疗诊断。

患者数据：
{json.dumps(log_data, ensure_ascii=False, indent=2)}
"""

    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI 分析服务调用失败：{str(e)}"
