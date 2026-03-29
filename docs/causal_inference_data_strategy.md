# 鼻炎SaaS应用 → Data Agent 时空因果推断数据策略

## 一、现状评估

### 1.1 当前数据模型分析

**User表** (基础画像):
- ✅ `rhinitis_years`: 患病年限
- ✅ `primary_symptoms`: 主要症状
- ⚠️ **缺失**: 鼻炎类型分类、家族史、共病信息

**DailyLog表** (日志数据):
- ✅ **时空维度**: `date`, `latitude`, `longitude`
- ✅ **症状维度**: 4个核心症状评分 (0-10)
- ✅ **环境维度**: 温度、湿度、AQI、过敏原信息
- ✅ **生活方式**: 睡眠、压力、运动、饮食
- ✅ **干预措施**: 用药、洗鼻、其他疗法
- ⚠️ **缺失**: 详细的环境污染物、室内环境、生理指标

### 1.2 医学文献支撑

根据最新研究 ([ARIA-EAACI 2024-2025](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFlkIoTNyBiCxI3F6abJxLtesafC4cg9jJT7vMxuXQaoA2k5mQ6hESOWK4VpfXp7DFKEUK2r-eOoD24kxUA99Z3ZzPFrHnfKGj_m5xt2tLprUIPoz3wit0FtZgqwtSvkv1DHj7KlO3APkKBYxP8jlw=), [时空分析研究](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFmNqZAcTzLlJv-NxPHykZoyX3N9UUu-M_rsWvvwF2yYwZWT02ijLDlsB653XsFBAwOIre3TFR4MYqzIteTOQ4COMw17L0FJp1dNClApgqbuL3YcxCfIEMafyZ6lGDjEngYVkGqwarhXXjWftNPHhTnoSDbl3v92DoOVpVVT4VRHZTbjs0CY1yrVKIeenY8N9I=))，鼻炎因果推断需要以下关键数据维度：

**核心因果变量**:
1. **环境触发因子** (Treatment/Exposure):
   - 空气污染物: PM2.5, PM10, NO₂, O₃, CO, SO₂
   - 气象因素: 温度、湿度、降雨量、气压
   - 过敏原: 花粉浓度、霉菌孢子、尘螨密度
   - 室内环境: 通风状况、室内湿度、宠物接触

2. **结果变量** (Outcome):
   - 症状严重程度 (多维度评分)
   - 生活质量影响 (QoL)
   - 就医频率、用药依赖度

3. **混淆因子** (Confounders):
   - 个体特征: 年龄、性别、遗传倾向、共病
   - 生活方式: 吸烟、饮食、运动、睡眠
   - 社会经济: 职业暴露、居住环境

4. **时空效应**:
   - 滞后效应 (Lag Effect): 暴露后1-7天的延迟反应
   - 季节性: 花粉季、供暖季
   - 地理差异: 城市vs农村、气候带

---

## 二、数据增强方案

### 2.1 数据库Schema扩展

#### 方案A: 最小侵入式 (推荐优先实施)
在现有`DailyLog`表增加字段:

```python
# 环境污染物 (详细)
pm25 = Column(Float, nullable=True)           # PM2.5 (μg/m³)
pm10 = Column(Float, nullable=True)           # PM10 (μg/m³)
no2 = Column(Float, nullable=True)            # 二氧化氮 (μg/m³)
o3 = Column(Float, nullable=True)             # 臭氧 (μg/m³)
co = Column(Float, nullable=True)             # 一氧化碳 (mg/m³)
so2 = Column(Float, nullable=True)            # 二氧化硫 (μg/m³)

# 气象详细
precipitation = Column(Float, nullable=True)  # 降雨量 (mm)
pressure = Column(Float, nullable=True)       # 气压 (hPa)
wind_speed = Column(Float, nullable=True)     # 风速 (m/s)

# 过敏原详细
pollen_count = Column(Integer, nullable=True) # 花粉浓度 (粒/m³)
pollen_type = Column(String, nullable=True)   # 花粉类型 (如"桦树","豚草")
mold_spores = Column(Integer, nullable=True)  # 霉菌孢子浓度

# 室内环境
indoor_humidity = Column(Float, nullable=True)    # 室内湿度 (%)
indoor_ventilation = Column(Integer, nullable=True) # 通风评分 (0-10)
pet_contact = Column(Boolean, default=False)      # 今日是否接触宠物
dust_exposure = Column(Integer, nullable=True)    # 灰尘暴露评分 (0-10)

# 生理指标
body_temperature = Column(Float, nullable=True)   # 体温 (°C)
heart_rate = Column(Integer, nullable=True)       # 心率 (bpm)
blood_pressure_sys = Column(Integer, nullable=True) # 收缩压
blood_pressure_dia = Column(Integer, nullable=True) # 舒张压

# 生活质量 (QoL)
qol_sleep_disruption = Column(Integer, nullable=True)  # 睡眠干扰 (0-10)
qol_work_impact = Column(Integer, nullable=True)       # 工作影响 (0-10)
qol_social_impact = Column(Integer, nullable=True)     # 社交影响 (0-10)
qol_mood = Column(Integer, nullable=True)              # 情绪状态 (0-10)

# 干预效果追踪
medication_effectiveness = Column(Integer, nullable=True) # 用药效果 (0-10)
treatment_adherence = Column(Integer, nullable=True)      # 治疗依从性 (0-10)
```

#### 方案B: 规范化设计 (长期优化)
创建独立的关联表:

```python
class EnvironmentalData(Base):
    """环境数据表 (可从第三方API自动填充)"""
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("savemyself_daily_logs.id"))

    # 空气质量
    pm25 = Column(Float)
    pm10 = Column(Float)
    no2 = Column(Float)
    o3 = Column(Float)
    co = Column(Float)
    so2 = Column(Float)

    # 气象
    temperature = Column(Float)
    humidity = Column(Float)
    precipitation = Column(Float)
    pressure = Column(Float)
    wind_speed = Column(Float)

    # 过敏原
    pollen_count = Column(Integer)
    pollen_type = Column(String)
    mold_spores = Column(Integer)

    # 数据来源
    data_source = Column(String)  # 如 "OpenWeatherMap", "AirNow"
    fetched_at = Column(DateTime)

class IndoorEnvironment(Base):
    """室内环境表"""
    __tablename__ = "indoor_environment"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("savemyself_daily_logs.id"))

    indoor_humidity = Column(Float)
    indoor_temperature = Column(Float)
    ventilation_score = Column(Integer)
    pet_contact = Column(Boolean)
    dust_exposure = Column(Integer)
    smoking_exposure = Column(Boolean)
    cooking_fuel_type = Column(String)  # 如 "天然气", "电磁炉"

class PhysiologicalData(Base):
    """生理指标表 (可选，如果用户有智能手环)"""
    __tablename__ = "physiological_data"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("savemyself_daily_logs.id"))

    body_temperature = Column(Float)
    heart_rate = Column(Integer)
    blood_pressure_sys = Column(Integer)
    blood_pressure_dia = Column(Integer)
    sleep_duration_minutes = Column(Integer)
    sleep_deep_minutes = Column(Integer)
    steps_count = Column(Integer)
```

### 2.2 User表扩展 (基础画像增强)

```python
# 在User表增加字段
class User(Base):
    # ... 现有字段 ...

    # 鼻炎分类
    rhinitis_type = Column(String, nullable=True)  # "季节性", "常年性", "混合型"
    diagnosed_date = Column(Date, nullable=True)   # 确诊日期

    # 家族史与共病
    family_history = Column(Boolean, default=False)  # 家族过敏史
    has_asthma = Column(Boolean, default=False)      # 是否合并哮喘
    has_eczema = Column(Boolean, default=False)      # 是否合并湿疹
    has_conjunctivitis = Column(Boolean, default=False) # 是否合并结膜炎

    # 已知过敏原
    known_allergens = Column(Text, nullable=True)  # JSON格式: ["尘螨", "花粉", "猫毛"]

    # 社会经济因素
    occupation = Column(String, nullable=True)     # 职业 (用于职业暴露分析)
    smoking_status = Column(String, nullable=True) # "从不", "曾经", "当前"
    residence_type = Column(String, nullable=True) # "城市", "郊区", "农村"
```

---

## 三、数据采集实施路径

### 3.1 Phase 1: 快速启动 (1-2周)

**目标**: 最小化用户负担，自动化采集环境数据

**实施步骤**:
1. **保持现有表结构不变**，先通过第三方API自动填充环境数据
2. **集成环境数据API**:
   - 空气质量: [和风天气API](https://dev.qweather.com/) (中国), [OpenWeatherMap](https://openweathermap.org/api/air-pollution) (全球)
   - 花粉数据: [中国气象局花粉监测](http://www.nmc.cn/publish/observations/pollen.html)
   - 气象数据: 和风天气、OpenWeatherMap
3. **后台自动填充**: 用户打卡时，根据`latitude/longitude`自动调用API填充环境数据
4. **前端优化**: 简化打卡表单，只保留核心症状+生活方式，环境数据后台自动获取

**代码示例** (FastAPI后端):
```python
import httpx
from datetime import date

async def fetch_environmental_data(lat: float, lon: float, log_date: date):
    """自动获取环境数据"""
    async with httpx.AsyncClient() as client:
        # 和风天气API示例
        weather_resp = await client.get(
            "https://devapi.qweather.com/v7/weather/now",
            params={"location": f"{lon},{lat}", "key": "YOUR_API_KEY"}
        )
        air_resp = await client.get(
            "https://devapi.qweather.com/v7/air/now",
            params={"location": f"{lon},{lat}", "key": "YOUR_API_KEY"}
        )

        weather = weather_resp.json()["now"]
        air = air_resp.json()["now"]

        return {
            "temperature": float(weather["temp"]),
            "humidity": float(weather["humidity"]),
            "pressure": float(weather["pressure"]),
            "wind_speed": float(weather["windSpeed"]),
            "aqi": int(air["aqi"]),
            "pm25": float(air["pm2p5"]),
            "pm10": float(air["pm10"]),
            "no2": float(air["no2"]),
            "o3": float(air["o3"]),
            "co": float(air["co"]),
            "so2": float(air["so2"]),
        }
```

### 3.2 Phase 2: 渐进增强 (1-2个月)

**目标**: 引导用户补充关键混淆因子

**实施策略**:
1. **智能提示**: AI分析用户数据后，提示补充关键缺失字段
   - 例: "我们发现你的症状波动较大,补充室内环境信息可以帮助找到更精准的触发因素"
2. **可选字段**: 将新增字段设为可选，不强制填写
3. **游戏化激励**: 数据完整度进度条，完整度越高AI分析越精准
4. **分阶段采集**:
   - Week 1-2: 只采集核心症状+自动环境数据
   - Week 3-4: 引导补充室内环境 (通风、宠物、灰尘)
   - Week 5+: 引导补充生活质量影响 (QoL)

### 3.3 Phase 3: 深度整合 (3-6个月)

**目标**: 与Data Agent因果推断工具链打通

**实施步骤**:
1. **数据导出接口**: 提供标准化CSV/GeoJSON导出
2. **Data Agent连接器**: 在Data Agent的`connectors/`包中创建`SaveMyselfConnector`
3. **因果分析Pipeline**: 在Data Agent中创建专用的鼻炎因果分析Skill

---

## 四、Data Agent因果推断集成方案

### 4.1 数据连接器设计

在`D:\adk\data_agent\connectors\`创建新连接器:

```python
# savemyself_connector.py
from .base import BaseConnector
import httpx
import geopandas as gpd
from shapely.geometry import Point

class SaveMyselfConnector(BaseConnector):
    """SaveMyself鼻炎SaaS数据连接器"""

    def __init__(self, api_base_url: str, api_key: str):
        self.api_base_url = api_base_url
        self.api_key = api_key

    async def fetch_data(self, params: dict) -> gpd.GeoDataFrame:
        """
        获取用户鼻炎日志数据

        params:
            user_id: 用户ID (可选,管理员可查询所有用户)
            start_date: 开始日期
            end_date: 结束日期
            anonymize: 是否匿名化 (默认True)
        """
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.api_base_url}/api/export/logs",
                params=params,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            data = resp.json()

        # 转换为GeoDataFrame
        gdf = gpd.GeoDataFrame(
            data,
            geometry=[Point(row['longitude'], row['latitude'])
                     for row in data],
            crs="EPSG:4326"
        )

        # 时间索引
        gdf['date'] = pd.to_datetime(gdf['date'])
        gdf = gdf.set_index('date')

        return gdf
```

### 4.2 因果推断Skill设计

在`D:\adk\data_agent\skills\`创建新Skill:

```yaml
# rhinitis-causal-analysis/skill.yaml
name: rhinitis-causal-analysis
description: 鼻炎时空因果推断分析
version: 1.0.0
category: health-analytics

instructions: |
  你是一个专业的鼻炎因果推断分析专家。你的任务是:

  1. 从SaveMyself SaaS平台获取用户鼻炎日志数据
  2. 使用CausalInferenceToolset进行时空因果分析
  3. 识别个体化的症状触发因素 (Triggers)
  4. 识别缓解因素 (Relievers)
  5. 生成个性化的预防建议

  分析流程:
  - 使用PSM (倾向得分匹配) 控制混淆因子
  - 使用Granger因果检验识别时间滞后效应
  - 使用GCCM (广义收敛交叉映射) 分析非线性因果关系
  - 使用Causal Forest识别异质性治疗效应 (个体差异)

  重点关注:
  - 环境因素 (PM2.5, 温度, 湿度, 花粉) 对症状的因果效应
  - 干预措施 (用药, 洗鼻) 的实际效果
  - 生活方式 (睡眠, 压力, 运动) 的调节作用
  - 滞后效应 (1-7天的延迟反应)

toolsets:
  - causal_inference
  - spatial_statistics
  - visualization
  - database

resources:
  - medical_knowledge/rhinitis_triggers.md
  - medical_knowledge/causal_inference_methods.md
```

### 4.3 分析Pipeline示例

用户在Data Agent中的交互流程:

```
用户: "分析我过去3个月的鼻炎数据,找出导致症状加重的主要原因"

Data Agent:
1. 调用SaveMyselfConnector获取数据
2. 数据预处理 (缺失值填充, 异常值检测)
3. 使用PSM匹配对照组 (症状轻vs症状重的日子)
4. 使用Causal Forest识别异质性效应:
   - PM2.5 > 75 μg/m³ 时,你的症状加重风险增加 47% (p<0.001)
   - 室内湿度 > 70% 时,症状加重风险增加 32% (p<0.01)
   - 睡眠质量 < 5分 时,症状加重风险增加 28% (p<0.05)
5. 使用Granger因果检验发现:
   - PM2.5暴露后2-3天症状达到峰值 (滞后效应)
   - 洗鼻后1天症状显著改善 (即时效应)
6. 生成可视化报告:
   - 因果效应森林图
   - 时空热力图 (症状严重区域)
   - 干预效果对比图
7. 个性化建议:
   - 当PM2.5预报 > 75时,提前1天开始预防用药
   - 保持室内湿度在50-60%
   - 优先改善睡眠质量
```

---

## 五、数据质量保障

### 5.1 最小样本量估算

根据因果推断方法的统计功效要求:

| 分析方法 | 最小样本量 | 推荐样本量 | 说明 |
|---------|----------|----------|------|
| PSM | 100条记录 | 300+ | 每个用户至少3个月数据 |
| Granger因果 | 50条时序 | 180+ | 至少6个月连续数据 |
| GCCM | 100条时序 | 365+ | 至少1年数据,捕捉季节性 |
| Causal Forest | 200条记录 | 500+ | 需要足够的异质性样本 |

**建议**:
- 单用户分析: 至少6个月连续打卡 (180条记录)
- 群体分析: 至少100个活跃用户,每人3个月数据

### 5.2 数据质量检查清单

**必需字段** (缺失率 < 10%):
- ✅ 日期、位置 (时空坐标)
- ✅ 核心症状评分 (4个维度)
- ✅ 环境数据 (温度、湿度、AQI、PM2.5)

**重要字段** (缺失率 < 30%):
- ⚠️ 生活方式 (睡眠、压力、运动)
- ⚠️ 干预措施 (用药、洗鼻)

**可选字段** (缺失率 < 50%):
- 🔵 室内环境
- 🔵 生理指标
- 🔵 生活质量影响

### 5.3 数据验证规则

```python
# 数据验证示例
def validate_daily_log(log: DailyLog) -> List[str]:
    """验证日志数据质量"""
    errors = []

    # 症状评分范围
    for field in ['nasal_congestion', 'runny_nose', 'sneezing', 'itchiness']:
        value = getattr(log, field)
        if value < 0 or value > 10:
            errors.append(f"{field} 必须在0-10之间")

    # 环境数据合理性
    if log.temperature and (log.temperature < -40 or log.temperature > 50):
        errors.append("温度超出合理范围")

    if log.humidity and (log.humidity < 0 or log.humidity > 100):
        errors.append("湿度必须在0-100%之间")

    if log.pm25 and log.pm25 < 0:
        errors.append("PM2.5不能为负数")

    # 位置数据
    if not log.latitude or not log.longitude:
        errors.append("缺少位置信息,无法进行时空分析")

    return errors
```

---

## 六、隐私与伦理考量

### 6.1 数据脱敏策略

在导出到Data Agent时:
- **位置模糊化**: 精确到区县级 (±5km随机偏移)
- **时间泛化**: 精确到周 (可选)
- **用户ID哈希**: 不可逆加密
- **敏感字段移除**: 姓名、邮箱、详细地址

### 6.2 知情同意

在用户注册时明确告知:
- 数据用于个人健康分析
- 匿名化数据可用于群体研究
- 用户可随时撤回数据授权
- 数据不会出售给第三方

---

## 七、实施优先级建议

### 🔴 P0 (立即实施)
1. **集成环境数据API** - 自动填充PM2.5、温度、湿度等
2. **User表扩展** - 增加鼻炎类型、家族史、共病字段
3. **数据导出API** - 提供CSV/GeoJSON导出接口

### 🟡 P1 (1-2个月)
4. **DailyLog表扩展** - 增加详细污染物、室内环境字段
5. **SaveMyselfConnector** - 在Data Agent中创建连接器
6. **基础因果分析** - 实现PSM + Granger因果检验

### 🟢 P2 (3-6个月)
7. **高级因果分析** - 实现GCCM + Causal Forest
8. **实时预警系统** - 基于因果模型的症状预测
9. **群体知识发现** - 跨用户的新模式挖掘

---

## 八、成功指标

### 数据指标
- 用户日均打卡率 > 70%
- 环境数据自动填充率 > 95%
- 关键字段缺失率 < 20%

### 分析指标
- 因果效应识别准确率 > 80% (与医学文献对比)
- 个性化建议采纳率 > 50%
- 症状改善用户占比 > 60%

### 科研指标
- 发现至少3个新的因果关联模式
- 发表1篇高质量医学期刊论文
- 为医学界提供开放数据集

---

## 参考文献

1. [ARIA-EAACI Guidelines 2024-2025](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFlkIoTNyBiCxI3F6abJxLtesafC4cg9jJT7vMxuXQaoA2k5mQ6hESOWK4VpfXp7DFKEUK2r-eOoD24kxUA99Z3ZzPFrHnfKGj_m5xt2tLprUIPoz3wit0FtZgqwtSvkv1DHj7KlO3APkKBYxP8jlw=)
2. [Spatiotemporal Analysis of Allergic Rhinitis](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFmNqZAcTzLlJv-NxPHykZoyX3N9UUu-M_rsWvvwF2yYwZWT02ijLDlsB653XsFBAwOIre3TFR4MYqzIteTOQ4COMw17L0FJp1dNClApgqbuL3YcxCfIEMafyZ6lGDjEngYVkGqwarhXXjWftNPHhTnoSDbl3v92DoOVpVVT4VRHZTbjs0CY1yrVKIeenY8N9I=)
3. [Environmental Triggers and Air Pollution](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQERoBp0qXqO2lccez-jyIBELg7H7g9m9HgWwplugKt6q7QZS2SSEZL2ighLE7pxfzG7WU1ColjruKnB6tUnMdcQrJ9FwhckL0Vg9PUR9CnN742gjBAtnQkwrgTdnvaSvjOjAg==)
4. [NIH Allergic Rhinitis Research](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHeHSAC489V_H0oFreIIEU2d9v5X-kPzIPBW5DvD2kzwfuE4eA_rbIpeNDdrniWW2nG1WKXIwVITJrkBTziJJIlJvfRZtQmfRYeVwbLeRgWYuuTHRCndfX5CPG0jYfsy6B3c3Rnjpfehh3Kjt0p)

