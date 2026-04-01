"use client";

import { useRouter } from 'next/navigation';

// AI分析等长耗时请求直接访问后端，绕过Next.js rewrite代理的超时限制
const API_BASE_URL = '/api';
const BACKEND_DIRECT_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // AI分析请求直接走后端，避免Next.js代理30秒超时
  const isLongRunning = url.startsWith('/ai/analyze');
  const baseUrl = (isLongRunning && BACKEND_DIRECT_URL) ? BACKEND_DIRECT_URL : API_BASE_URL;

  const newOptions = {
    ...options,
    headers,
    cache: 'no-store' as RequestCache
  };

  const response = await fetch(`${baseUrl}${url}`, newOptions);

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};
