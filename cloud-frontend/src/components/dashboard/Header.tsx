"use client";

import React from "react";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";

export const Header = () => {
  const { selectedOrg, isLoading } = useDashboard();
  const pathname = usePathname();

  const getCurrentViewName = () => {
    if (pathname === "/dashboard") return "Overview";
    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {isLoading ? (
           <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        ) : (
          <>
            <span className="hover:text-slate-800 cursor-pointer font-medium transition-colors">
              {selectedOrg?.name || "Select Organization"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{getCurrentViewName()}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <Button className="h-9 px-4 text-sm shadow-sm hover:shadow-md">
          <Plus size={16} className="mr-2" />
          New Project
        </Button>
      </div>
    </header>
  );
};