"use client";

import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { DashboardProvider } from "@/context/DashboardContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen transition-all duration-300">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}