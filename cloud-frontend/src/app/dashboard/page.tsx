"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { IProject } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard"; // Import the new component

// --- Mock Stats ---
const MOCK_STATS = [
  { label: "Total Projects", value: "0", change: "--", trend: "neutral" },
  { label: "Active Deployments", value: "0", change: "--", trend: "neutral" },
  { label: "Total Requests", value: "0", change: "--", trend: "neutral" },
];

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

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-slate-800">
                {i === 0 ? projects.length : stat.value}
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
        
        {/* 3. Projects List (Using ProjectCard) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
            <Link href="/dashboard/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
          </div>

          {isProjectsLoading ? (
             <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
             </div>
          ) : projects.length === 0 ? (
             <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <p className="text-slate-500 mb-4">No projects found in this organization.</p>
                <Link href="/dashboard/projects/new" className="text-blue-600 font-medium hover:underline">Create your first project</Link>
             </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* 4. Activity */}
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