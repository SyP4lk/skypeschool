'use client';
import React from 'react';
export default function Input({ className='', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`} {...props} />;
}
