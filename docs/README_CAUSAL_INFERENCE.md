# SaveMyself → Data Agent 因果推断集成方案总结

## 📋 项目背景

你的SaveMyself SaaS应用旨在帮助鼻炎患者通过长期数据追踪找到个性化的治愈方案。为了实现这一目标,需要通过时空因果推断分析识别导致症状加重的真实因果因素。

本方案设计了从SaaS数据采集到Data Agent因果分析的完整闭环。

---

## ✅ 现状评估

### 已有优势
- ✅ 时空维度: `date`, `latitude`, `longitude`
- ✅ 核心症状: 4个维度评分 (0-10)
- ✅ 基础环境: 温度、湿度、AQI
- ✅ 生活方式: 睡眠、压力、运动、饮食
- ✅ 干预措施: 用药、洗鼻

### 关键缺失
- ⚠️ 详细污染物: PM2.5, PM10, NO₂, O₃, CO, SO₂
- ⚠️ 气象详细: 降雨量、气压、风速
- ⚠️ 过敏原: 花粉浓度、类型、霉菌孢子
- ⚠️ 室内环境: 通风、宠物、灰尘
- ⚠️ 用户画像: 鼻炎类型、家族史、共病

---

## 🎯 解决方案

### 核心策略: 自动化 + 渐进式

**Phase 1 (1-2周)**: 环境数据自动采集
- 集成和风天气/OpenWeatherMap API
- 用户打卡时后台自动填充PM2.5等污染物数据
- 最小化用户负担,填充率目标 >95%

**Phase 2 (2-4周)**: 数据导出与连接
- 创建数据导出API (支持脱敏)
- 在Data Agent中创建SaveMyselfConnector
- 建立数据通道

**Phase 3 (4-8周)**: 因果分析集成
- 创建rhinitis-causal-analysis Skill
- 集成现有CausalInferenceToolset (PSM, Granger, GCCM, Causal Forest)
- 生成个性化分析报告

---

## 📊 医学文献支撑

根据最新研究 ([ARIA-EAACI 2024-2025](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFlkIoTNyBiCxI3F6abJxLtesafC4cg9jJT7vMxuXQaoA2k5mQ6hESOWK4VpfXp7DFKEUK2r-eOoD24kxUA99Z3ZzPFrHnfKGj_m5xt2tLprUIPoz3wit0FtZgqwtSvkv1DHj7KlO3APkKBYxP8jlw=), [时空分析](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFmNqZAcTzLlJv-NxPHykZoyX3N9UUu-M_rsWvvwF2yYwZWT02ijLDlsB653XsFBAwOIre3TFR4MYqzIteTOQ4COMw17L0FJp1dNClApgqbuL3YcxCfIEMafyZ6lGDjEngYVkGqwarhXXjWftNPHhTnoSDbl3v92DoOVpVVT4VRHZTbjs0CY1yrVKIeenY8N9I=)):

**关键发现**:
- PM2.5每升高10μg/m³,过敏性鼻炎风险增加14%
- 温度波动、湿度变化显著影响症状
- 存在2-7天的滞后效应
- 个体差异巨大,需要个性化分析

**因果推断方法**:
- PSM (倾向得分匹配): 控制混淆因子
- Granger因果检验: 识别时间滞后效应
- GCCM: 分析非线性因果关系
- Causal Forest: 识别异质性治疗效应

---

## 📁 交付文档

### 1. 战略规划
- **`causal_inference_data_strategy.md`**: 完整的数据增强策略
  - 医学文献支撑
  - 数据模型设计 (方案A/B)
  - 数据质量要求
  - 隐私保护策略

### 2. 实施路线图
- **`implementation_roadmap.md`**: 三阶段实施计划
  - 详细任务清单
  - 验收标准
  - 成功指标
  - 数据闭环设计图

### 3. 代码实现
- **`models_enhanced.py`**: 增强版数据模型
- **`environmental_service.py`**: 环境数据自动采集服务
- **`001_causal_inference_enhancement.py`**: 数据库迁移脚本
- **`savemyself_connector.py`**: Data Agent连接器
- **`rhinitis-causal-analysis/skill.yaml`**: 因果分析Skill

### 4. 快速开始
- **`quick_start_guide.md`**: Phase 1实施步骤
  - API密钥获取
  - 环境配置
  - 测试验证
  - 常见问题

---

## 🔢 数据要求

### 最小样本量
- 单用户分析: 180条记录 (6个月)
- 群体分析: 100用户 × 90条 (3个月)

### 数据完整性
- 必需字段 (缺失率<10%): 时空坐标、症状、环境数据
- 重要字段 (缺失率<30%): 生活方式、干预措施

---

## 🔄 数据闭环

```
用户打卡 → 环境数据自动填充 → PostgreSQL存储
    ↓
数据导出API (脱敏)
    ↓
Data Agent SaveMyselfConnector
    ↓
因果推断分析 (PSM + Granger + Causal Forest + GCCM)
    ↓
个性化报告: Top 5触发因素 + 滞后效应 + 预防建议
    ↓
(未来) 反馈到SaaS: 智能预警 + 干预推荐
```

---

## 🚀 立即行动

### 第一步: Phase 1实施 (本周)
1. 注册和风天气/OpenWeatherMap API
2. 配置环境变量
3. 运行数据库迁移
4. 集成environmental_service.py
5. 测试环境数据自动填充

### 第二步: 数据积累 (3-6个月)
- 引导用户持续打卡
- 监控数据质量
- 优化采集流程

### 第三步: 因果分析 (数据充足后)
- 部署Data Agent连接器
- 运行因果推断分析
- 验证分析结果

---

## 📈 预期成果

### 短期 (3个月)
- 环境数据自动填充率 >95%
- 积累10,000+条高质量记录
- 用户日均打卡率 >70%

### 中期 (6个月)
- 完成单用户因果分析
- 识别Top 5个体化触发因素
- 个性化建议采纳率 >50%

### 长期 (1年+)
- 群体模式发现
- 发现新的因果关联
- 发表医学研究论文
- 为医学界提供开放数据集

---

## 🎓 科研价值

如果全球有成百上千万鼻炎患者持续分享数据,你的AI引擎不仅能精准定位个人专属过敏原,甚至有机会为医学界发现**全新的、尚未被文献报道的鼻炎治愈模式**。

每一次打卡,都是在为攻克鼻炎贡献力量!

---

## 📚 参考文献

1. [ARIA-EAACI Guidelines 2024-2025](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFlkIoTNyBiCxI3F6abJxLtesafC4cg9jJT7vMxuXQaoA2k5mQ6hESOWK4VpfXp7DFKEUK2r-eOoD24kxUA99Z3ZzPFrHnfKGj_m5xt2tLprUIPoz3wit0FtZgqwtSvkv1DHj7KlO3APkKBYxP8jlw=)
2. [Spatiotemporal Analysis of Allergic Rhinitis](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFmNqZAcTzLlJv-NxPHykZoyX3N9UUu-M_rsWvvwF2yYwZWT02ijLDlsB653XsFBAwOIre3TFR4MYqzIteTOQ4COMw17L0FJp1dNClApgqbuL3YcxCfIEMafyZ6lGDjEngYVkGqwarhXXjWftNPHhTnoSDbl3v92DoOVpVVT4VRHZTbjs0CY1yrVKIeenY8N9I=)
3. [Environmental Triggers and Air Pollution](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQERoBp0qXqO2lccez-jyIBELg7H7g9m9HgWwplugKt6q7QZS2SSEZL2ighLE7pxfzG7WU1ColjruKnB6tUnMdcQrJ9FwhckL0Vg9PUR9CnN742gjBAtnQkwrgTdnvaSvjOjAg==)
4. [NIH Allergic Rhinitis Research](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHeHSAC489V_H0oFreIIEU2d9v5X-kPzIPBW5DvD2kzwfuE4eA_rbIpeNDdrniWW2nG1WKXIwVITJrkBTziJJIlJvfRZtQmfRYeVwbLeRgWYuuTHRCndfX5CPG0jYfsy6B3c3Rnjpfehh3Kjt0p)

---

**祝你的SaveMyself项目成功! 期待它能帮助千万鼻炎患者找到治愈之路。** 🌟
