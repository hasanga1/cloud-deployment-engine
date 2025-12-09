"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Box, Activity, Settings, Users, Cloud, LogOut } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, isLoading } = useDashboard();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/dashboard/projects", icon: Box },
    { label: "Observability", href: "/dashboard/observability", icon: Activity },
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-20">
      {/* 1. Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-600">
          <Cloud size={24} fill="currentColor" className="text-blue-100" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight text-slate-800">CloudDeploy</span>
        </div>
      </div>

      {/* 2. Org Switcher */}
      <OrganizationSwitcher />

      {/* 3. Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 4. User Footer */}
      <div className="p-4 border-t border-slate-100">
        {isLoading ? (
          <div className="flex items-center gap-3 mb-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-100 rounded-full" />
            <div className="flex-1 space-y-1"><div className="h-3 bg-slate-100 rounded w-3/4" /></div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};