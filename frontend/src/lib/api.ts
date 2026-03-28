"use client";

import { useRouter } from 'next/navigation';

const API_BASE_URL = '/api';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Create a new options object with the updated headers
  // Add cache: 'no-store' to prevent Next.js or browser aggressive caching
  const newOptions = { 
    ...options, 
    headers,
    cache: 'no-store' as RequestCache
  };
  
  const response = await fetch(`${API_BASE_URL}${url}`, newOptions);
  
  if (response.status === 401) {
    // Token is invalid or expired
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
};
