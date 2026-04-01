"use client";

import { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";

function HomeForm() {
  const searchParams = useSearchParams();
  const queryDate = searchParams.get("date");
  const defaultDate = queryDate || format(new Date(), "yyyy-MM-dd");

  const [formData, setFormData] = useState({
    date: defaultDate,
    nasal_congestion: 0,
    runny_nose: 0,
    sneezing: 0,
    itchiness: 0,
    temperature: "",
    humidity: "",
    latitude: null as number | null,
    longitude: null as number | null,
    pm25: "",
    pm10: "",
    no2: "",
    o3: "",
    co: "",
    so2: "",
    precipitation: "",
    pressure: "",
    wind_speed: "",
    sleep_quality: 5,
    stress_level: 5,
    diet_notes: "",
    medications: "",
    nasal_wash: false,
    other_treatments: "",
    notes: ""
  });
  const [status, setStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [debugInfo, setDebugInfo] = useState("正在初始化...");
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // 监听 URL 参数的变化 (从历史页面跳转过来时)
  useEffect(() => {
    if (queryDate && queryDate !== formData.date) {
      setFormData(prev => ({ ...prev, date: queryDate }));
    }
  }, [queryDate]);

  // 当日期改变时，尝试拉取当天的已有记录
  useEffect(() => {
    const fetchLogForDate = async () => {
      setDebugInfo(`正在拉取 ${formData.date} 的数据...`);
      try {
        const response = await fetchWithAuth(`/logs/${formData.date}`);
        setDebugInfo(`服务器响应: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          // 如果存在记录，则填充表单
          setFormData({
            date: data.date,
            nasal_congestion: data.nasal_congestion || 0,
            runny_nose: data.runny_nose || 0,
            sneezing: data.sneezing || 0,
            itchiness: data.itchiness || 0,
            temperature: data.temperature !== null ? String(data.temperature) : "",
            humidity: data.humidity !== null ? String(data.humidity) : "",
            latitude: data.latitude !== null ? Number(data.latitude) : null,
            longitude: data.longitude !== null ? Number(data.longitude) : null,
            pm25: data.pm25 !== null ? String(data.pm25) : "",
            pm10: data.pm10 !== null ? String(data.pm10) : "",
            no2: data.no2 !== null ? String(data.no2) : "",
            o3: data.o3 !== null ? String(data.o3) : "",
            co: data.co !== null ? String(data.co) : "",
            so2: data.so2 !== null ? String(data.so2) : "",
            precipitation: data.precipitation !== null ? String(data.precipitation) : "",
            pressure: data.pressure !== null ? String(data.pressure) : "",
            wind_speed: data.wind_speed !== null ? String(data.wind_speed) : "",
            sleep_quality: data.sleep_quality || 5,
            stress_level: data.stress_level || 5,
            diet_notes: data.diet_notes || "",
            medications: data.medications || "",
            nasal_wash: data.nasal_wash || false,
            other_treatments: data.other_treatments || "",
            notes: data.notes || ""
          });
          setIsUpdating(true);
          setStatus("已加载当天记录，您可以进行修改。");
          setDebugInfo(`成功加载 ${formData.date} 数据`);
        } else {
          const errorData = await response.json().catch(() => ({ detail: "Unknown" }));
          // 如果是404未找到，重置表单为默认状态(保留当前日期)
          setFormData(prev => ({
            ...prev,
            date: prev.date,
            nasal_congestion: 0,
            runny_nose: 0,
            sneezing: 0,
            itchiness: 0,
            temperature: "",
            humidity: "",
            latitude: null,
            longitude: null,
            pm25: "",
            pm10: "",
            no2: "",
            o3: "",
            co: "",
            so2: "",
            precipitation: "",
            pressure: "",
            wind_speed: "",
            sleep_quality: 5,
            stress_level: 5,
            diet_notes: "",
            medications: "",
            nasal_wash: false,
            other_treatments: "",
            notes: ""
          }));
          setIsUpdating(false);
          setStatus("");
          setDebugInfo(`未找到数据 (Status: ${response.status}, Detail: ${errorData.detail})`);
        }
      } catch (error: any) {
        if (error.message !== 'Unauthorized') {
          console.error("Error fetching log:", error);
          setDebugInfo(`获取数据时发生异常: ${error.message}`);
        }
      }
    };

    fetchLogForDate();
  }, [formData.date]);

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      alert("您的浏览器不支持地理位置功能");
      return;
    }
    
    setIsFetchingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 使用免费的 Open-Meteo API 获取气象数据
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m`);
          const weatherData = await weatherRes.json();

          // 获取空气质量污染物数据
          const aqRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`);
          const aqData = await aqRes.json();
          
          if (weatherData && weatherData.current) {
            setFormData(prev => ({
              ...prev,
              temperature: String(weatherData.current.temperature_2m),
              humidity: String(weatherData.current.relative_humidity_2m),
              precipitation: String(weatherData.current.precipitation || ""),
              pressure: String(weatherData.current.surface_pressure || ""),
              wind_speed: String(weatherData.current.wind_speed_10m || ""),
              pm25: aqData?.current?.pm2_5 ? String(aqData.current.pm2_5) : prev.pm25,
              pm10: aqData?.current?.pm10 ? String(aqData.current.pm10) : prev.pm10,
              co: aqData?.current?.carbon_monoxide ? String(aqData.current.carbon_monoxide) : prev.co,
              no2: aqData?.current?.nitrogen_dioxide ? String(aqData.current.nitrogen_dioxide) : prev.no2,
              so2: aqData?.current?.sulphur_dioxide ? String(aqData.current.sulphur_dioxide) : prev.so2,
              o3: aqData?.current?.ozone ? String(aqData.current.ozone) : prev.o3,
              latitude: Number(latitude),
              longitude: Number(longitude)
            }));
            setStatus("✅ 环境与空气质量全数据获取成功");
          }
        } catch (error) {
          console.error("获取环境数据失败:", error);
          setStatus("❌ 获取环境数据失败，请手动填写或稍后重试");
        } finally {
          setIsFetchingWeather(false);
        }
      },
      (error) => {
        console.error("获取位置失败:", error);
        setStatus("❌ 无法获取位置权限，请手动填写");
        setIsFetchingWeather(false);
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("保存中...");
    
    try {
      // 提交到后端，由于后端已改为 upsert 逻辑，我们统一用 POST
      const response = await fetchWithAuth("/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nasal_congestion: Number(formData.nasal_congestion),
          runny_nose: Number(formData.runny_nose),
          sneezing: Number(formData.sneezing),
          itchiness: Number(formData.itchiness),
          temperature: formData.temperature ? Number(formData.temperature) : null,
          humidity: formData.humidity ? Number(formData.humidity) : null,
          latitude: formData.latitude !== null ? Number(formData.latitude) : null,
          longitude: formData.longitude !== null ? Number(formData.longitude) : null,
          pm25: formData.pm25 ? Number(formData.pm25) : null,
          pm10: formData.pm10 ? Number(formData.pm10) : null,
          no2: formData.no2 ? Number(formData.no2) : null,
          o3: formData.o3 ? Number(formData.o3) : null,
          co: formData.co ? Number(formData.co) : null,
          so2: formData.so2 ? Number(formData.so2) : null,
          precipitation: formData.precipitation ? Number(formData.precipitation) : null,
          pressure: formData.pressure ? Number(formData.pressure) : null,
          wind_speed: formData.wind_speed ? Number(formData.wind_speed) : null,
          env_data_source: "Open-Meteo API",
          sleep_quality: Number(formData.sleep_quality),
          stress_level: Number(formData.stress_level)
        })
      });

      if (response.ok) {
        setStatus(isUpdating ? "更新成功！✅" : "记录成功！✅");
        setIsUpdating(true);
      } else {
        const errorData = await response.json();
        setStatus(`保存失败: ${errorData.detail || "未知错误"}`);
      }
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        setStatus(`保存出错: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">今日状况 🤧</h2>
        <p className="text-sm text-slate-500">坚持每天打卡，让AI找到你的潜在触发物。</p>
        {/* 开发调试信息，生产环境可移除 */}
        <p className="text-xs text-blue-500 mt-1">🔄 状态: {debugInfo}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">日期 (切换日期可查看/修改历史)</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>
        </div>

        {/* 症状打分 */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="font-semibold text-slate-800">症状严重程度 (0-10)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">鼻塞程度: {formData.nasal_congestion}</label>
              <input type="range" name="nasal_congestion" min="0" max="10" value={formData.nasal_congestion} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">流涕程度: {formData.runny_nose}</label>
              <input type="range" name="runny_nose" min="0" max="10" value={formData.runny_nose} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">打喷嚏: {formData.sneezing}</label>
              <input type="range" name="sneezing" min="0" max="10" value={formData.sneezing} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">发痒: {formData.itchiness}</label>
              <input type="range" name="itchiness" min="0" max="10" value={formData.itchiness} onChange={handleChange} className="w-full" />
            </div>
          </div>
        </div>

        {/* 治疗干预 */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="font-semibold text-slate-800">干预措施</h3>
          
          <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" name="nasal_wash" checked={formData.nasal_wash} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
            <span className="text-slate-700 font-medium">洗鼻了吗？🌊</span>
          </label>

          <div>
            <label className="block text-sm text-slate-600 mb-1">用药情况 (喷剂/口服药)</label>
            <input type="text" name="medications" value={formData.medications} onChange={handleChange} placeholder="例如：内舒拿，早晚各一次" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        
        {/* 生活方式 & 饮食 */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">环境、饮食与暴露</h3>
            <button 
              type="button" 
              onClick={fetchWeather}
              disabled={isFetchingWeather}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isFetchingWeather ? "获取中..." : "📍 自动获取全环境数据"}
            </button>
          </div>

          {formData.pm25 && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div>🌡️ {formData.temperature} °C</div>
              <div>💧 {formData.humidity} %</div>
              <div>🌧️ {formData.precipitation} mm</div>
              <div>🌬️ {formData.wind_speed} m/s</div>
              <div>☁️ 气压 {formData.pressure} hPa</div>
              <div>😷 PM2.5 {formData.pm25}</div>
              <div>🌫️ PM10 {formData.pm10}</div>
              <div>🚗 NO2 {formData.no2}</div>
              <div>☀️ O3 {formData.o3}</div>
            </div>
          )}
          
          <div>
            <label className="block text-sm text-slate-600 mb-1">特殊饮食或过敏原接触</label>
            <input type="text" name="diet_notes" value={formData.diet_notes} onChange={handleChange} placeholder="例如：吃了辣、喝了冰牛奶、去朋友家撸猫了" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <button type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-colors active:scale-[0.98] ${isUpdating ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {isUpdating ? "更新保存修改" : "记录今日状况"}
        </button>

        {status && <div className="text-center text-sm font-medium mt-2 text-slate-600">{status}</div>}
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-slate-500">加载中...</div>}>
      <HomeForm />
    </Suspense>
  );
}
