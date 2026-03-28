"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rhinitis_years: 0,
    primary_symptoms: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. 注册账号
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rhinitis_years: Number(formData.rhinitis_years)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "注册失败");
      }

      // 2. 自动登录获取 token
      const loginData = new URLSearchParams();
      loginData.append("username", formData.email);
      loginData.append("password", formData.password);

      const loginRes = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginData.toString(),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        localStorage.setItem("token", data.access_token);
        window.location.href = "/";
      } else {
        router.push("/login");
      }

    } catch (err: any) {
      setError(err.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">加入 SaveMyself</h2>
          <p className="text-slate-500 mt-2">建立您的专属鼻炎健康档案</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
            <input 
              type="email" name="email" 
              value={formData.email} onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input 
              type="password" name="password" 
              value={formData.password} onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required 
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">您患鼻炎大约多少年了？</label>
            <input 
              type="number" name="rhinitis_years" min="0"
              value={formData.rhinitis_years} onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">最困扰您的主要症状是？</label>
            <input 
              type="text" name="primary_symptoms" 
              placeholder="例如：长年鼻塞、一换季就打喷嚏"
              value={formData.primary_symptoms} onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center pt-2">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 mt-4 rounded-lg font-bold text-white transition-all ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
          >
            {loading ? '注册中...' : '注册并登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          已有账户？ <a href="/login" className="text-blue-600 font-semibold hover:underline">去登录</a>
        </div>
      </div>
    </div>
  );
}
