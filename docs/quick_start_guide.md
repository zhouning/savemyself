# 快速开始指南 - SaveMyself 因果推断增强

## 🚀 Phase 1 实施步骤 (1-2周)

### 步骤 1: 获取API密钥

**和风天气API** (中国用户):
1. 访问 https://dev.qweather.com/
2. 注册账号并创建应用
3. 获取API Key (免费版每天1000次调用)

**OpenWeatherMap API** (全球备用):
1. 访问 https://openweathermap.org/api
2. 注册账号
3. 获取API Key (免费版每分钟60次调用)

### 步骤 2: 配置环境变量

在 `backend/.env` 文件中添加:

```bash
# 环境数据API密钥
QWEATHER_API_KEY=your_qweather_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
```

### 步骤 3: 运行数据库迁移

```bash
cd backend

# 如果使用Alembic
alembic upgrade head

# 或者直接执行SQL (PostgreSQL)
psql -U your_user -d savemyself_db -f migrations/001_causal_inference_enhancement.sql
```

### 步骤 4: 安装依赖

```bash
# 在backend目录
pip install httpx  # 如果还没安装
```

### 步骤 5: 集成环境数据服务

将以下文件复制到项目:
- `backend/app/environmental_service.py`
- `backend/app/models_enhanced.py` (参考,逐步迁移)

### 步骤 6: 修改日志创建API

在 `backend/app/main.py` 中:

```python
from .environmental_service import EnvironmentalDataService, env_service

@router.post("/api/logs")
async def create_log(log_data: DailyLogCreate, db: Session = Depends(get_db)):
    # 自动获取环境数据
    if log_data.latitude and log_data.longitude:
        try:
            env_data = await env_service.fetch_all_data(
                log_data.latitude,
                log_data.longitude,
                log_data.date
            )
            # 合并环境数据
            log_dict = log_data.dict()
            log_dict.update(env_data)
        except Exception as e:
            logger.warning(f"环境数据获取失败: {e}")
            log_dict = log_data.dict()
    else:
        log_dict = log_data.dict()

    # 创建日志
    log = DailyLog(**log_dict)
    db.add(log)
    db.commit()
    db.refresh(log)

    return {"status": "success", "log_id": log.id}
```

### 步骤 7: 测试

```bash
# 启动后端
uvicorn app.main:app --reload

# 测试环境数据获取
curl -X POST http://localhost:8000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "date": "2026-03-29",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "nasal_congestion": 7,
    "runny_nose": 6,
    "sneezing": 8,
    "itchiness": 5
  }'

# 检查返回的数据是否包含pm25, temperature等字段
```

---

## 📊 验证数据质量

### SQL查询检查

```sql
-- 检查环境数据填充率
SELECT
    COUNT(*) as total_logs,
    COUNT(pm25) as pm25_filled,
    COUNT(temperature) as temp_filled,
    COUNT(humidity) as humidity_filled,
    ROUND(COUNT(pm25)::numeric / COUNT(*) * 100, 2) as pm25_fill_rate,
    ROUND(COUNT(temperature)::numeric / COUNT(*) * 100, 2) as temp_fill_rate
FROM savemyself_daily_logs
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- 检查数据来源分布
SELECT
    env_data_source,
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM savemyself_daily_logs) * 100, 2) as percentage
FROM savemyself_daily_logs
WHERE env_data_source IS NOT NULL
GROUP BY env_data_source;

-- 检查异常值
SELECT date, latitude, longitude, pm25, temperature
FROM savemyself_daily_logs
WHERE pm25 > 500 OR temperature < -40 OR temperature > 50
ORDER BY date DESC;
```

---

## 🔍 常见问题

### Q1: API调用失败怎么办?
**A**: 检查以下几点:
- API密钥是否正确
- 是否超过免费额度
- 网络连接是否正常
- 坐标是否在服务范围内

### Q2: 环境数据填充率低?
**A**: 可能原因:
- 用户未提供位置信息
- API服务不稳定
- 坐标超出服务范围

解决方案: 在前端强制要求位置权限,或使用IP定位作为备用

### Q3: 如何处理历史数据?
**A**: 创建批量回填脚本:

```python
# backfill_env_data.py
async def backfill_historical_logs():
    """回填历史日志的环境数据"""
    logs = db.query(DailyLog).filter(
        DailyLog.pm25.is_(None),
        DailyLog.latitude.isnot(None)
    ).all()

    for log in logs:
        try:
            env_data = await env_service.fetch_all_data(
                log.latitude, log.longitude, log.date
            )
            for key, value in env_data.items():
                setattr(log, key, value)
            db.commit()
            print(f"✓ 回填日志 {log.id}")
        except Exception as e:
            print(f"✗ 日志 {log.id} 失败: {e}")
```

---

## 📈 下一步

完成Phase 1后:
1. 监控环境数据填充率 (目标 >95%)
2. 收集至少3个月的数据
3. 准备Phase 2: 数据导出API和Data Agent连接器

---

## 📞 支持

遇到问题? 查看:
- 详细策略文档: `docs/causal_inference_data_strategy.md`
- 实施路线图: `docs/implementation_roadmap.md`
- API文档: `docs/api_documentation.md`
