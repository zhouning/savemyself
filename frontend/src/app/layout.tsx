import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaveMyself",
  description: "鼻炎治愈AI探索系统",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold text-blue-600">SaveMyself 🌿</h1>
              <Navigation />
            </div>
          </header>
          <main className="max-w-md mx-auto p-4">
            {children}
          </main>
          
          <nav className="fixed bottom-0 w-full max-w-md mx-auto bg-white border-t border-slate-200 left-0 right-0 z-10">
            <div className="flex justify-around py-3">
              <a href="/" className="text-slate-500 flex flex-col items-center">
                <span className="text-xs font-medium mt-1">打卡</span>
              </a>
              <a href="/history" className="text-slate-500 flex flex-col items-center">
                <span className="text-xs font-medium mt-1">记录</span>
              </a>
              <a href="/ai" className="text-blue-600 flex flex-col items-center">
                <span className="text-xs font-medium mt-1">AI专家</span>
              </a>
            </div>
          </nav>
        </div>
      </body>
    </html>
  );
}
