"use client";

import React, { useEffect, useState } from "react";
import { Server, GitCommit, Clock, MoreVertical, Check, AlertCircle, X } from "lucide-react";
import api from "@/lib/api";
import { IProject } from "@/types";

// Types for the Health Endpoint Response
interface ProjectHealth {
  DEV: number;
  STG: number;
  PROD: number;
}

// --- Sub-Component: Filled Health Circle ---
const HealthIndicator = ({ percentage, label }: { percentage: number; label: string }) => {
  // Determine color and icon based on health percentage
  let bgClass = "bg-slate-200 text-slate-400"; // Default: 0% (Gray)
  let Icon = X; // Default Icon

  if (percentage === 1) {
    bgClass = "bg-green-500 text-white shadow-green-200 shadow-md"; // 100% (Green)
    Icon = Check;
  } else if (percentage > 0) {
    bgClass = "bg-amber-400 text-white shadow-amber-200 shadow-md"; // 1-99% (Amber)
    Icon = AlertCircle;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
      
      {/* Filled Circle Container */}
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${bgClass}`}
      >
        {/* Optional: Simple Icon inside the filled circle for better UX */}
        <Icon size={16} strokeWidth={3} />
      </div>
    </div>
  );
};

export const ProjectCard = ({ project }: { project: IProject }) => {
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHealth = async () => {
      try {
        const res = await api.get(`/api/projects/${project.id}/health`);
        if (isMounted) setHealth(res.data);
      } catch (error) {
        console.error(`Failed to load health for project ${project.id}`);
        if (isMounted) setHealth({ DEV: 0, STG: 0, PROD: 0 });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHealth();

    return () => {
      isMounted = false;
    };
  }, [project.id]);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-blue-300 transition-colors cursor-pointer">
      
      {/* Left Side: Project Info */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Server size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <GitCommit size={12} /> main
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Health Status Indicators */}
      <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
        {loading ? (
           // Loading Skeleton
           <div className="flex gap-4">
             {[1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-2 w-6 bg-slate-100 rounded"/> 
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"/>
                </div>
             ))}
           </div>
        ) : (
          <>
            <HealthIndicator label="DEV" percentage={health?.DEV || 0} />
            <HealthIndicator label="STG" percentage={health?.STG || 0} />
            <HealthIndicator label="PROD" percentage={health?.PROD || 0} />
          </>
        )}

        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full ml-2 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};