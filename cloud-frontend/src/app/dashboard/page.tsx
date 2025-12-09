"use client";

import React, { useEffect, useState } from "react";
import { 
  ArrowUpRight, GitCommit, Clock, MoreVertical, Activity, Server, Loader2, AlertCircle, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api"; // Real API
import { useDashboard } from "@/context/DashboardContext";
import { IProject } from "@/types";

// --- Mock Stats for visual completeness (Backend doesn't provide these yet) ---
const MOCK_STATS = [
  { label: "Total Projects", value: "0", change: "--", trend: "neutral" },
  { label: "Active Deployments", value: "0", change: "--", trend: "neutral" },
  { label: "Total Requests", value: "0", change: "--", trend: "neutral" },
];

// --- Sub-Component: Status Dot ---
const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    success: "bg-green-500",
    failed: "bg-red-500",
    warning: "bg-amber-500",
    neutral: "bg-slate-300"
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || colors.neutral}`} />;
};

export default function DashboardPage() {
  const { user, selectedOrg } = useDashboard();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  // Fetch Projects whenever selectedOrg changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedOrg) return;
      
      setIsProjectsLoading(true);
      try {
        const res = await api.get(`/api/projects/org/${selectedOrg.id}`);
        setProjects(res.data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setIsProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [selectedOrg]);

  if (!selectedOrg) {
     return (
        <div className="h-[50vh] flex items-center justify-center flex-col text-slate-400">
             <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
             <p>Loading Organization...</p>
        </div>
     )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500">
          Welcome back, {user?.firstName}. Managing <span className="font-medium text-slate-700">{selectedOrg.name}</span>.
        </p>
      </div>

      {/* 2. Stats Grid (Mocked for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-slate-800">
                {i === 0 ? projects.length : stat.value} {/* Use real project count */}
              </h3>
              <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={14} />
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. Projects List (Real Data) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
            <Link href="/dashboard/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
          </div>

          {isProjectsLoading ? (
             <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
             </div>
          ) : projects.length === 0 ? (
             <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <p className="text-slate-500 mb-4">No projects found in this organization.</p>
                <Link href="/dashboard/projects/new" className="text-blue-600 font-medium hover:underline">Create your first project</Link>
             </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-blue-300 transition-colors cursor-pointer">
                  
                  {/* Project Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Server size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><GitCommit size={12} /> main</span>
                        <span>•</span>
                        {/* Use real createdAt if available, else placeholder */}
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock Environment Statuses (Since project API doesn't return component status deeply yet) */}
                  <div className="flex items-center gap-6 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    {["DEV", "STG", "PROD"].map((env) => (
                      <div key={env} className="flex flex-col gap-1 items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{env}</span>
                        <StatusDot status="neutral" /> {/* Placeholder status */}
                      </div>
                    ))}
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full ml-2">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Activity (Mocked as per instruction) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 3 && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-slate-100"></div>}
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 z-10">
                    <CheckCircle2 size={14} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">System</span> updated <span className="font-medium">Environment</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Just now</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}