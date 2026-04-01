"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";

export default function AIAnalysis() {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro");

  useEffect(() => {
    fetchModels();
    fetchUserProfile();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetchWithAuth("/ai/models");
      const data = await response.json();
      setModels(data.models);
    } catch (err) {
      console.error("Failed to fetch models:", err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetchWithAuth("/users/me");
      const data = await response.json();
      if (data.preferred_ai_model) {
        setSelectedModel(data.preferred_ai_model);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const saveModelPreference = async (model: string) => {
    try {
      await fetchWithAuth("/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "",
          preferred_ai_model: model
        }),
      });
    } catch (err) {
      console.error("Failed to save model preference:", err);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/ai/analyze");
      const data = await response.json();
      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        setError(data.detail || "分析失败");
      }
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        setError("网络错误: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">AI 鼻炎专家 🤖</h2>
        <p className="text-sm text-slate-500">基于大语言模型分析你的长期打卡数据，找出隐藏的过敏原或缓解因素。</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          选择AI模型
        </label>
        <select
          value={selectedModel}
          onChange={(e) => {
            setSelectedModel(e.target.value);
            saveModelPreference(e.target.value);
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {models.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      <button 
        onClick={runAnalysis} 
        disabled={loading}
        className={`w-full font-bold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
          loading ? "bg-slate-200 text-slate-500" : "bg-purple-600 hover:bg-purple-700 text-white active:scale-[0.98] shadow-md"
        }`}
      >
        <span>{loading ? "AI 正在思考中..." : "立刻进行深度归因分析"}</span>
      </button>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 space-y-4">
          <h3 className="font-semibold text-purple-900 border-b border-purple-100 pb-2">分析结果</h3>
          <div className="prose prose-sm prose-purple text-slate-700 whitespace-pre-wrap">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
