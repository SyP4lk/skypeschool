'use client';
import React from 'react';
export default function Button({ children, className='', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition ${className}`} {...props}>{children}</button>;
}
