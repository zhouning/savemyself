# SaveMyself - AI驱动的慢性鼻炎个性化管理平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

🌐 **在线体验**: [https://www.ibiyan.com](https://www.ibiyan.com)

## 项目背景
本项目源于为13年慢性鼻炎寻找治愈方案的真实需求。现已升级为 **多用户 SaaS 平台**，利用 AI 大语言模型（Google Gemini）、环境数据追踪（Open-Meteo API）和因果推断技术，为全球鼻炎患者提供个性化的症状管理和归因分析。

## ✨ 核心功能

### 📊 多维度症状追踪
- **症状评分**: 鼻塞、流涕、打喷嚏、鼻痒（0-10分）
- **环境数据**: 自动获取温度、湿度、PM2.5、PM10、NO2、O3、CO、SO2、AQI等11项指标
- **生活方式**: 睡眠质量、压力水平、运动时长、饮食记录
- **干预措施**: 药物使用、洗鼻、其他治疗方案

### 🤖 AI深度归因分析
- 基于 Google Gemini 2.0 的智能分析引擎
- 识别个性化的症状触发因素（Triggers）
- 发现有效的缓解措施（Relievers）
- 提供基于数据的下一步行动建议

### 🔐 多租户架构
- JWT身份认证，7天token有效期
- 用户数据完全隔离
- 管理员后台支持
- 登录审计日志

## 为什么需要长期数据追踪？(科学依据)
根据最新国际顶级医学文献（如 PubMed 收录的权威研究、Meta分析），慢性鼻炎/过敏性鼻炎的诱发因素（Triggers）高度个性化且极其复杂。研究表明，以下因素在不同患者身上表现出截然不同的相关性：
*   **气象与环境因素**：温度波动（每升高1°C过敏风险增加14%）、相对湿度、降雨量（影响霉菌与花粉扩散）。
*   **室内暴露**：尘螨 (HDM)、室内霉菌（暴露于潮湿环境使风险增加 1.49-1.66 倍）、宠物皮屑。
*   **生活方式与干预**：睡眠质量、压力水平、抗生素/抗酸药使用史，以及饮食结构。

**传统医疗往往只能提供通用指南，而 SaveMyself 系统的终极目标是：**
如果全球有成百上千万的鼻炎患者在这里持续分享脱敏后的打卡数据，我们的 AI 引擎就能通过数据挖掘，不仅能精准定位你**个人的专属过敏原和缓解模式**，甚至有机会为医学界发现**全新的、尚未被文献报道的鼻炎治愈模式**。你的每一次打卡，都是在为攻克鼻炎贡献一份力量！

## 多用户 SaaS 系统架构设计
系统采用多租户(Multi-tenant)架构，确保数据隐私与隔离，主要包含以下几个核心模块：

### 1. 用户系统与数据收集 (User & Data Ingestion)
*   **用户隔离与画像**: 每个用户拥有独立的账户体系，记录其患病年限、主要症状等基本画像。
*   **个人数据追踪 (多维因果变量)**: 用户每日打卡记录症状严重程度（0-10 评分）、生活作息、特殊饮食，以及尝试过的干预方案。
*   **全景环境与气象追踪 (Open-Meteo API)**: 系统支持一键获取用户精准地理位置，并自动拉取并记录高达 11 项核心环境指标，包括气温、湿度、降雨量、气压、风速，以及空气质量（PM2.5、PM10、NO2、O3、SO2、CO）。这些数据为发现非线性的因果触发模式（如气象的滞后效应）提供了坚实的基础。
*   **公开病例与文献获取**: 从公共医疗论坛、文献库收集类似症状的病例和最新医学研究进展，构建共享知识库。

### 2. 知识库模块 (Knowledge Base & RAG)
*   构建专属的向量数据库，存储医学文献、治疗方案。
*   利用RAG（检索增强生成）技术，让AI在生成建议时能够精准引用真实的医学知识。

### 3. AI 分析与决策引擎 (AI Engine)
*   **千人千面的归因分析**: 针对每个用户的独立数据，分析其专属的症状波动与环境、饮食、情绪等变量之间的相关性（Triggers & Relievers）。
*   **个性化方案生成**: 结合用户画像和共享知识库，生成针对该用户的专属治疗建议和日常护理指南。
*   **效果评估与迭代**: 持续跟踪用户执行某一方案后的数据变化，动态调整后续策略。

### 4. 交互界面 (Frontend UI)
*   基于 Next.js 的现代化移动端友好界面，支持用户注册/登录、每日快捷打卡、历史追踪以及一键获取专属 AI 分析报告。

## 🛠 技术栈

**后端**
- FastAPI + SQLAlchemy + PostgreSQL
- Google Gemini 2.0 Flash (AI分析)
- Open-Meteo API (环境数据)
- JWT认证 + bcrypt密码加密

**前端**
- Next.js 14 + React 18 + TypeScript
- TailwindCSS + Lucide Icons
- 移动端优先的响应式设计

**部署**
- Google Cloud Run (Serverless)
- Docker容器化
- PostgreSQL云数据库

## 🚀 快速开始

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 环境变量配置
```bash
# backend/.env
DATABASE_URL=postgresql://user:password@host:port/dbname
GEMINI_API_KEY=your_gemini_api_key
ENVIRONMENT=development
```

## 数据隐私与免责声明
**隐私声明：** 本系统高度重视用户医疗数据的隐私，采用严格的数据隔离措施。位置信息等敏感数据仅用于气候与环境建模。
**免责声明：** 本项目及其AI系统提供的所有建议和分析结果仅供探索和参考，绝对不能替代专业医生的诊断和正规治疗。在尝试任何新的药物或治疗方案前，请务必咨询专业医疗人员。
