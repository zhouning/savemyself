"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // 获取用户信息，判断是否是管理员
      fetchWithAuth("/users/me")
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch user");
        })
        .then(data => {
          if (data && data.is_admin) {
            setIsAdmin(true);
          }
        })
        .catch(err => {
          console.error("Auth check failed:", err);
          // Token可能过期
          if (err.message === 'Unauthorized') {
             setIsLoggedIn(false);
          }
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsAdmin(false);
    window.location.href = "/login";
  };

  if (!isLoggedIn) {
    return (
      <div className="flex space-x-3 text-sm">
        <a href="/login" className="text-slate-600 font-medium hover:text-blue-600">登录</a>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {isAdmin && (
        <a href="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-700">
          ⚙️ 控制台
        </a>
      )}
      <button 
        onClick={handleLogout}
        className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
      >
        退出
      </button>
    </div>
  );
}
