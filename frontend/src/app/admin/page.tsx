"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth("/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setIsAdmin(true);
      } else {
        setError("获取用户数据失败。您可能没有管理员权限。");
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">平台控制台 ⚙️</h2>
        <p className="text-sm text-slate-500">管理平台注册用户，控制资源访问权限（Tokens）。</p>
      </div>

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
    </div>
  );
}
