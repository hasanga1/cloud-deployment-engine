"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Activity,
  Box,
  Globe,
  Plus,
  Building2,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { IProject } from "@/types";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/Button";
import { EmptyOrgState } from "@/components/dashboard/EmptyOrgState";

export default function DashboardPage() {
  const {
    user,
    selectedOrg,
    orgs,
    isLoading: isGlobalLoading,
  } = useDashboard();

  // Local State
  const [projects, setProjects] = useState<IProject[]>([]);
  const [stats, setStats] = useState({ projects: 0, deployments: 0 });
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Fetch Data whenever selectedOrg changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedOrg) return;

      setIsDashboardLoading(true);
      try {
        const [projectsRes, projStatsRes, deployStatsRes] = await Promise.all([
          api.get(`/api/projects/org/${selectedOrg.id}`),
          api.get(`/api/orgs/${selectedOrg.id}/stats/projects`),
          api.get(`/api/orgs/${selectedOrg.id}/stats/deployments`),
        ]);

        setProjects(projectsRes.data);
        setStats({
          projects: projStatsRes.data,
          deployments: deployStatsRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    fetchData();
  }, [selectedOrg]);

  const statCards = [
    {
      label: "Total Projects",
      value: stats.projects,
      change: "Active",
      icon: Box,
      trend: "neutral",
    },
    {
      label: "Active Deployments",
      value: stats.deployments,
      change: "Running",
      icon: Activity,
      trend: "up",
    },
    {
      label: "Total Requests",
      value: "0",
      change: "--",
      icon: Globe,
      trend: "neutral",
    },
  ];

  if (isGlobalLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Loading your account...</p>
      </div>
    );
  }

  if (orgs.length === 0) {
    return <EmptyOrgState />;
  }

  if (!selectedOrg) {
    return (
      <div className="h-[50vh] flex items-center justify-center flex-col text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Switching Organization...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h1>
        <p className="text-slate-500">
          Welcome back, {user?.firstName}. Managing{" "}
          <span className="font-medium text-slate-700">{selectedOrg.name}</span>
          .
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <stat.icon size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-slate-800">
                {isDashboardLoading ? "-" : stat.value}
              </h3>
              <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={14} />
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
            <Link href="/projects/new">
              <Button className="h-8 px-3 text-xs shadow-sm shadow-blue-500/20 cursor-pointer">
                <Plus size={14} className="mr-1.5" />
                Create Project
              </Button>
            </Link>
          </div>

          {isDashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <p className="text-slate-500 mb-4">
                No projects found in this organization.
              </p>
              <Link
                href="/projects/new"
                className="text-blue-600 font-medium hover:underline"
              >
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 3 && (
                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-slate-100"></div>
                  )}
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 z-10">
                    <CheckCircle2 size={14} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">System</span> updated{" "}
                      <span className="font-medium">Environment</span>
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
