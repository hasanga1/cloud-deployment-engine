"use client";

import React, { useEffect, useState } from "react";
import { Server, Clock, MoreVertical, GitCommit } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { IProject } from "@/types";

// --- Time Helper ---
const formatProjectDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if it is the same day
  const isToday = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else {
    // Return exact date DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

// --- Sub-Component: Simple Health Ring (Visual Only) ---
const HealthRing = ({ percentage, label }: { percentage: number; label: string }) => {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - percentage * circumference;
  
  let colorClass = "text-slate-300"; 
  if (percentage === 1) colorClass = "text-green-500";
  else if (percentage > 0) colorClass = "text-amber-500"; 

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle cx="16" cy="16" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
          <circle cx="16" cy="16" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-500 ease-out ${colorClass}`} />
        </svg>
      </div>
    </div>
  );
};

export const ProjectCard = ({ project }: { project: IProject }) => {
  const router = useRouter();
  const [health, setHealth] = useState({ DEV: 0, STG: 0, PROD: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await api.get(`/api/projects/${project.id}/health`);
        if (isMounted) setHealth(res.data);
      } catch (error) {
        if (isMounted) setHealth({ DEV: 0, STG: 0, PROD: 0 });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHealth();
    return () => { isMounted = false; };
  }, [project.id]);

  return (
    <div 
      onClick={() => router.push(`/projects/${project.id}`)}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-blue-300 transition-colors cursor-pointer"
    >
      {/* Left: Project Name & Time */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
          <Server size={22} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              <Clock size={12} /> 
              {formatProjectDate(project.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};