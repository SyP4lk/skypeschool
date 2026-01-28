'use client';
import React from 'react';
export function Card({ children, className='' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 p-4 shadow-sm bg-white ${className}`}>{children}</div>;
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-semibold mb-3">{children}</div>;
}
