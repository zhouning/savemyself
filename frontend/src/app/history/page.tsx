"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function History() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetchWithAuth("/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error: any) {
      if (error.message !== 'Unauthorized') {
        console.error("Failed to fetch logs:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-500 py-10">加载记录中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">历史打卡 📅</h2>
        <p className="text-sm text-slate-500">回顾你过去的症状记录。点击任意卡片即可返回修改该天的数据。</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-xl border border-slate-100 text-slate-500">
          还没有任何打卡记录，去首页记录第一天吧！
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div 
              key={log.id} 
              onClick={() => router.push(`/?date=${log.date}`)}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-3">
                <span className="font-bold text-slate-700">{format(new Date(log.date), "yyyy年MM月dd日")}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 hover:text-blue-500">点击修改 ✏️</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                    综合症状: {log.nasal_congestion + log.runny_nose + log.sneezing + log.itchiness}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                <div>👃 鼻塞: {log.nasal_congestion}/10</div>
                <div>💧 流涕: {log.runny_nose}/10</div>
                <div>🤧 喷嚏: {log.sneezing}/10</div>
                <div>👀 发痒: {log.itchiness}/10</div>
              </div>

              {(log.medications || log.nasal_wash) && (
                <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <span className="font-medium text-slate-700">干预: </span>
                  {log.nasal_wash && "🌊洗鼻 "}
                  {log.medications && `💊${log.medications}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
