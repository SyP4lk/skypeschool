"use client";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@/shared/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider><ToastProvider>{children}</ToastProvider></HeroUIProvider>;
}
