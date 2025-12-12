"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Settings,
  Users,
  Cloud,
  LogOut,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useDashboard();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selected_org_id");
    localStorage.removeItem("selected_project_id");
    localStorage.removeItem("selected_component_id");
    router.push("/auth");
  };

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Observability", href: "/observability", icon: Activity },
    { label: "Members", href: "/members", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  // Helper to get initials
  const getInitials = () => {
    if (!user) return "U";
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
      {/* 1. Header: Logo & Name */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-blue-600">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Cloud
              size={24}
              fill="currentColor"
              className="text-blue-200"
              strokeWidth={2.5}
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            CloudDeploy
          </span>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Check active state (handle sub-routes too, e.g. /dashboard/projects/123)
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              <item.icon
                size={18}
                className={`transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer: User Profile & Sign Out */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        {isLoading || !user ? (
          // Loading Skeleton
          <div className="flex items-center gap-3 mb-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-2 bg-slate-200 rounded w-full" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4 px-1">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 shrink-0">
              {getInitials()}
            </div>

            {/* Info */}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-slate-200 hover:border-red-100 bg-white cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
