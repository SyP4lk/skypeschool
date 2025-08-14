'use client';
import React from 'react';
export default function Select({ className='', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`} {...props}>{children}</select>;
}
