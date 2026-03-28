# Project Context (GEMINI.md)

This file provides foundational context for Gemini CLI in this workspace.

## Project Overview
**SaveMyself** 是一个探索利用人工智能寻找慢性鼻炎治愈方案的多用户 SaaS 平台。

**Purpose:** 通过结合大模型的医学知识、海量用户的长期症状/生活习惯数据追踪，寻找高度个性化（千人千面）的鼻炎治愈或缓解策略，旨在造福所有鼻炎患者。
**Architecture:** 多租户(Multi-tenant)架构，包含用户画像系统、数据收集与处理（个人打卡）、基于RAG的专业共享知识库、AI分析与诊断引擎（关联分析、方案生成）、以及移动端友好的交互前端。
**Technologies:** Python, FastAPI, SQLAlchemy, PostgreSQL, Next.js/React, TailwindCSS, Google Gemini API, Google Cloud Run (Serverless).

## Directory Overview
- `README.md`: 项目背景、多用户系统架构设计与免责声明。
- `backend/`: 存放数据处理、多用户认证MVP、AI分析引擎和 FastAPI 服务。
- `frontend/`: 基于 Next.js 的移动端友好界面，支持用户打卡和数据展示。

## Development Conventions
*   **Multi-tenant by Design**: 所有数据模型和 API 接口必须包含并校验 `user_id`，严格保障医疗数据的隐私与隔离。
*   **AI as a Medical Research Partner**: AI 充当每位用户的专属医疗数据分析师，挖掘个人变量相关性。
*   **Safety First**: 必须在代码注释、系统UI等所有显著位置声明：**AI输出仅供参考，不替代专业医疗建议**。

## Usage
此目录是 `SaveMyself` SaaS 系统的根目录。
- 启动后端：`cd backend && uvicorn app.main:app --reload`
- 启动前端：`cd frontend && npm run dev`

