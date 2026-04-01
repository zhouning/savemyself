"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rhinitis_years: 0,
    primary_symptoms: "",
    rhinitis_type: "混合型",
    family_history: false,
    has_asthma: false,
    has_eczema: false,
    smoking_status: "从不",
    residence_type: "城市"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
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
          {/* 基本信息 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
            <input 
              type="email" name="email" 
              value={formData.email} onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input 
              type="password" name="password" 
              value={formData.password} onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required 
            />
          </div>

          {/* 医学特征 (因果推断必须) */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3">医学特征与画像</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">患病年限 (年)</label>
                <input 
                  type="number" name="rhinitis_years" min="0"
                  value={formData.rhinitis_years} onChange={handleChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">主要症状</label>
                <input 
                  type="text" name="primary_symptoms" 
                  placeholder="如：长年鼻塞、打喷嚏"
                  value={formData.primary_symptoms} onChange={handleChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">鼻炎类型</label>
                  <select name="rhinitis_type" value={formData.rhinitis_type} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white">
                    <option value="常年性">常年性</option>
                    <option value="季节性">季节性</option>
                    <option value="混合型">混合型</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">居住环境</label>
                  <select name="residence_type" value={formData.residence_type} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white">
                    <option value="城市">城市</option>
                    <option value="郊区">郊区</option>
                    <option value="农村">农村</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">吸烟状态</label>
                <select name="smoking_status" value={formData.smoking_status} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white">
                  <option value="从不">从不吸烟</option>
                  <option value="曾经">曾经吸烟 (已戒)</option>
                  <option value="当前">当前吸烟</option>
                </select>
              </div>

              <div className="space-y-2 mt-3 pt-2 border-t border-slate-50">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="family_history" checked={formData.family_history} onChange={handleChange} className="text-blue-600 rounded" />
                  <span className="text-sm text-slate-700">直系亲属有过敏史</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="has_asthma" checked={formData.has_asthma} onChange={handleChange} className="text-blue-600 rounded" />
                  <span className="text-sm text-slate-700">曾确诊过「哮喘」</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="has_eczema" checked={formData.has_eczema} onChange={handleChange} className="text-blue-600 rounded" />
                  <span className="text-sm text-slate-700">曾确诊过「湿疹」</span>
                </label>
              </div>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center pt-2">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 mt-4 rounded-xl font-bold text-white transition-all ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
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
