# SaveMyself → Data Agent 因果推断集成实施路线图

## 📋 项目概览

**目标**: 建立从SaveMyself SaaS应用到Data Agent的数据闭环，实现鼻炎时空因果推断分析

**核心价值**:
- 用户在SaaS应用中积累个人健康数据
- Data Agent进行深度因果分析，识别个体化触发因素
- 分析结果反馈到SaaS应用，指导用户预防和治疗

---

## 🎯 三阶段实施计划

### Phase 1: 快速启动 (1-2周) 🔴 P0

**目标**: 最小化用户负担，自动化环境数据采集

#### 任务清单

**SaveMyself SaaS端**:
- [ ] 集成和风天气API (中国用户)
- [ ] 集成OpenWeatherMap API (全球备用)
- [ ] 实现`environmental_service.py`自动采集服务
- [ ] 修改日志创建API，自动填充环境数据
- [ ] 前端优化: 简化打卡表单，环境数据后台自动获取

**数据库迁移**:
```sql
-- 添加环境污染物详细字段
ALTER TABLE savemyself_daily_logs ADD COLUMN pm25 FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN pm10 FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN no2 FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN o3 FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN co FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN so2 FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN precipitation FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN pressure FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN wind_speed FLOAT;
ALTER TABLE savemyself_daily_logs ADD COLUMN env_data_source VARCHAR(50);
ALTER TABLE savemyself_daily_logs ADD COLUMN env_fetched_at TIMESTAMP;

-- 添加用户画像增强字段
ALTER TABLE savemyself_users ADD COLUMN rhinitis_type VARCHAR(50);
ALTER TABLE savemyself_users ADD COLUMN diagnosed_date DATE;
ALTER TABLE savemyself_users ADD COLUMN family_history BOOLEAN DEFAULT FALSE;
ALTER TABLE savemyself_users ADD COLUMN has_asthma BOOLEAN DEFAULT FALSE;
ALTER TABLE savemyself_users ADD COLUMN has_eczema BOOLEAN DEFAULT FALSE;
ALTER TABLE savemyself_users ADD COLUMN known_allergens TEXT;
ALTER TABLE savemyself_users ADD COLUMN occupation VARCHAR(100);
ALTER TABLE savemyself_users ADD COLUMN smoking_status VARCHAR(20);
ALTER TABLE savemyself_users ADD COLUMN residence_type VARCHAR(20);
```

**配置文件**:
```python
# config.py 添加
class Settings(BaseSettings):
    # ... 现有配置 ...

    # 环境数据API
    qweather_api_key: str = ""
    openweather_api_key: str = ""
```

**验收标准**:
- ✅ 用户打卡时，环境数据自动填充率 > 95%
- ✅ API响应时间 < 2秒
- ✅ 前端表单字段减少至核心症状+生活方式

---

### Phase 2: 数据导出与连接 (2-4周) 🟡 P1

**目标**: 建立SaaS到Data Agent的数据通道

#### 任务清单

**SaveMyself SaaS端**:
- [ ] 创建数据导出API `/api/export/logs`
- [ ] 实现数据脱敏逻辑 (位置模糊化、用户ID哈希)
- [ ] 添加API认证 (JWT Bearer Token)
- [ ] 实现数据质量验证

**Data Agent端**:
- [ ] 创建`SaveMyselfConnector`连接器
- [ ] 在`connectors/__init__.py`注册连接器
- [ ] 创建测试用例 `test_savemyself_connector.py`
- [ ] 更新文档 `docs/connectors.md`

**数据导出API示例**:
```python
# main.py
@router.get("/api/export/logs")
async def export_logs(
    user_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """导出鼻炎日志数据 (支持Data Agent连接器)"""

    # 权限检查
    if user_id and user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "无权访问其他用户数据")

    # 查询数据
    query = db.query(DailyLog)
    if user_id:
        query = query.filter(DailyLog.user_id == user_id)
    if start_date:
        query = query.filter(DailyLog.date >= start_date)
    if end_date:
        query = query.filter(DailyLog.date <= end_date)

    logs = query.all()

    # 转换为字典列表
    return [log_to_dict(log) for log in logs]
```

**验收标准**:
- ✅ Data Agent能成功连接并获取数据
- ✅ 数据脱敏正确执行
- ✅ 导出API性能: 1000条记录 < 3秒

---

### Phase 3: 因果分析集成 (4-8周) 🟢 P2

**目标**: 实现完整的因果推断分析流程

#### 任务清单

**Data Agent端**:
- [ ] 创建`rhinitis-causal-analysis` Skill
- [ ] 实现数据预处理工具函数
- [ ] 集成现有`CausalInferenceToolset`
- [ ] 创建可视化报告模板
- [ ] 编写分析示例和文档

**分析Pipeline示例**:
```python
# 用户在Data Agent中的交互
用户: "分析我过去6个月的鼻炎数据，找出症状加重的主要原因"

Data Agent执行流程:
1. 调用SaveMyselfConnector获取数据
2. 数据质量检查 (180条记录, 缺失率<20%)
3. 创建症状综合评分
4. PSM匹配: 症状重日 vs 症状轻日
5. Causal Forest分析:
   - PM2.5 > 75 μg/m³ → 症状加重风险 +47% (p<0.001)
   - 室内湿度 > 70% → 症状加重风险 +32% (p<0.01)
   - 睡眠质量 < 5分 → 症状加重风险 +28% (p<0.05)
6. Granger因果检验:
   - PM2.5暴露后2-3天症状达峰值
   - 洗鼻后1天症状显著改善
7. 生成报告 + 可视化
```

**验收标准**:
- ✅ 因果效应识别准确率 > 80% (与医学文献对比)
- ✅ 分析时间 < 30秒 (500条记录)
- ✅ 生成完整的可视化报告

---

## 📊 数据质量要求

### 最小样本量

| 分析类型 | 最小样本 | 推荐样本 | 时间跨度 |
|---------|---------|---------|---------|
| 单用户PSM | 100条 | 180条 | 3-6个月 |
| 单用户Granger | 50条 | 180条 | 6个月 |
| 单用户GCCM | 100条 | 365条 | 1年 |
| 群体分析 | 100用户×30条 | 100用户×90条 | 3个月 |

### 数据完整性要求

**必需字段** (缺失率 < 10%):
- 日期、位置 (时空坐标)
- 核心症状 (4个维度)
- 环境数据 (温度、湿度、PM2.5、AQI)

**重要字段** (缺失率 < 30%):
- 生活方式 (睡眠、压力)
- 干预措施 (用药、洗鼻)

---

## 🔄 数据闭环设计

```
┌─────────────────────────────────────────────────────────┐
│                    SaveMyself SaaS                       │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  用户打卡    │────────>│ 环境数据API  │             │
│  │  (症状+位置) │         │  自动填充    │             │
│  └──────────────┘         └──────────────┘             │
│         │                         │                      │
│         v                         v                      │
│  ┌─────────────────────────────────────┐               │
│  │      PostgreSQL 数据库              │               │
│  │  (daily_logs + environmental_data)  │               │
│  └─────────────────────────────────────┘               │
│         │                                                │
│         │ 数据导出API                                    │
│         v                                                │
└─────────────────────────────────────────────────────────┘
         │
         │ SaveMyselfConnector
         v
┌─────────────────────────────────────────────────────────┐
│                    Data Agent (ADK)                      │
│  ┌──────────────────────────────────────┐              │
│  │  rhinitis-causal-analysis Skill      │              │
│  │  ┌────────────────────────────────┐  │              │
│  │  │ 1. 数据预处理                  │  │              │
│  │  │ 2. PSM匹配                     │  │              │
│  │  │ 3. Causal Forest               │  │              │
│  │  │ 4. Granger因果检验             │  │              │
│  │  │ 5. GCCM非线性分析              │  │              │
│  │  └────────────────────────────────┘  │              │
│  └──────────────────────────────────────┘              │
│         │                                                │
│         v                                                │
│  ┌──────────────────────────────────────┐              │
│  │  因果分析报告                         │              │
│  │  - Top 5触发因素                     │              │
│  │  - 滞后效应分析                      │              │
│  │  - 干预措施效果                      │              │
│  │  - 个性化预防建议                    │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
         │
         │ 反馈到SaaS (未来功能)
         v
┌─────────────────────────────────────────────────────────┐
│              SaveMyself 智能预警系统                     │
│  - 基于因果模型的症状预测                                │
│  - 个性化预防提醒 (PM2.5预警)                           │
│  - 干预措施推荐优化                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 测试策略

### 单元测试
- [ ] `environmental_service.py` - API调用mock测试
- [ ] `savemyself_connector.py` - 数据获取和转换测试
- [ ] 数据验证逻辑测试

### 集成测试
- [ ] SaaS端到端: 打卡 → 环境数据填充 → 导出
- [ ] Data Agent端到端: 连接 → 获取数据 → 因果分析

### 性能测试
- [ ] 环境数据API响应时间 < 2秒
- [ ] 数据导出1000条 < 3秒
- [ ] 因果分析500条 < 30秒

---

## 📈 成功指标

### 数据指标
- 用户日均打卡率 > 70%
- 环境数据自动填充率 > 95%
- 关键字段缺失率 < 20%

### 分析指标
- 因果效应识别准确率 > 80%
- 个性化建议采纳率 > 50%
- 症状改善用户占比 > 60%

### 科研指标
- 发现至少3个新的因果关联模式
- 积累10,000+条高质量数据记录
- 为医学界提供开放数据集

---

## 🔐 隐私与安全

### 数据脱敏
- 位置模糊化: ±5km随机偏移
- 用户ID哈希: SHA256不可逆加密
- 敏感字段移除: 邮箱、详细地址

### 访问控制
- API认证: JWT Bearer Token
- 权限检查: 用户只能访问自己的数据
- 管理员审计: 所有导出操作记录日志

### 合规性
- GDPR: 用户可随时撤回数据授权
- 知情同意: 注册时明确告知数据用途
- 数据最小化: 只采集必要字段

---

## 📚 参考资源

- 详细策略文档: `docs/causal_inference_data_strategy.md`
- 增强数据模型: `backend/app/models_enhanced.py`
- 环境数据服务: `backend/app/environmental_service.py`
- Data Agent连接器: `data_agent/connectors/savemyself_connector.py`
- 因果分析Skill: `data_agent/skills/rhinitis-causal-analysis/`

---

## 🚀 下一步行动

1. **立即开始**: Phase 1环境数据API集成 (预计1周)
2. **并行准备**: 数据库迁移脚本编写
3. **文档完善**: API接口文档 + 用户隐私政策更新
