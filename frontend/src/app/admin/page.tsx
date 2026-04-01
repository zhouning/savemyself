"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetchWithAuth("/admin/users"),
        fetchWithAuth("/admin/login-logs")
      ]);
      
      if (usersRes.ok && logsRes.ok) {
        setUsers(await usersRes.json());
        setLoginLogs(await logsRes.json());
        setIsAdmin(true);
      } else {
        setError("获取数据失败。您可能没有管理员权限。");
      }
    } catch (err: any) {
      if (err.message === 'Unauthorized') return; // Handled by fetchWithAuth
      setError("网络错误或无权限: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetchWithAuth(`/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (response.ok) {
        // 更新本地列表
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      } else {
        alert("操作失败");
      }
    } catch (err) {
      console.error(err);
      alert("操作出错");
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500">加载中...</div>;
  }

  if (error || !isAdmin) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 bg-red-50 p-4 rounded-xl mb-4 border border-red-100">{error || "您没有访问此页面的权限。"}</div>
        <a href="/" className="text-blue-600 hover:underline">返回首页</a>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">平台控制台 ⚙️</h2>
        <p className="text-sm text-slate-500">管理平台注册用户，控制资源访问权限（Tokens）。</p>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
        <button 
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          注册用户管理
        </button>
        <button 
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'logs' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          登录审计日志
        </button>
      </div>

      {activeTab === "users" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700">总计 {users.length} 个注册用户</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-medium text-slate-800 flex items-center space-x-2">
                    <span>{user.email}</span>
                    {user.is_admin && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">管理员</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    注册于: {user.created_at} | 患病年限: {user.rhinitis_years}年
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    主诉症状: {user.primary_symptoms || "未填写"}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    disabled={user.is_admin}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      user.is_admin 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : user.is_active 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {user.is_admin ? "不受限" : (user.is_active ? "账号活跃 (停用)" : "已停用 (恢复)")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700">最近登录记录 ({loginLogs.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {loginLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm text-slate-800 break-all">
                    {log.email}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {log.success ? '成功' : '失败'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>IP: {log.ip_address || "未知"}</span>
                  <span>{format(new Date(log.timestamp), "yyyy/MM/dd HH:mm:ss")}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate" title={log.user_agent}>
                  {log.user_agent || "未知设备"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
