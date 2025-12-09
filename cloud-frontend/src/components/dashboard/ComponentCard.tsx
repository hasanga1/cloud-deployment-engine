"use client";

import React, { useEffect, useState } from "react";
import { Box, GitBranch, Clock, MoreVertical, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { IComponent } from "@/types";
import { useRouter } from "next/navigation";

// Interface for the new Status API response
interface ComponentStatus {
  DEV: boolean;
  STG: boolean;
  PROD: boolean;
}

// --- Sub-Component: Status Indicator ---
const EnvStatus = ({ env, isRunning }: { env: string; isRunning?: boolean }) => {
  // Determine color based on boolean status
  // True = Green (Running), False = Red (Not Running/Stopped)
  // We use specific colors for the dot and the outer ring
  const color = isRunning ? "bg-green-500" : "bg-red-500";
  const ring = isRunning ? "ring-green-100" : "ring-red-100";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{env}</span>
      <div className={`w-3 h-3 rounded-full ${color} ring-4 ${ring} transition-all`} />
    </div>
  );
};

export const ComponentCard = ({ component }: { component: IComponent }) => {
  const [status, setStatus] = useState<ComponentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/api/components/${component.id}/status`);
        if (isMounted) setStatus(res.data);
      } catch (error) {
        console.error("Failed to load component status");
        // Default to all false on error
        if (isMounted) setStatus({ DEV: false, STG: false, PROD: false });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();

    return () => { isMounted = false; };
  }, [component.id]);

  return (
    <div 
    onClick={() => router.push(`/dashboard/projects/${component.id}/components/${component.id}`)}
    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-blue-300 transition-all cursor-pointer">
      
      {/* Left: Component Info */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <Box size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
              {component.name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
              {component.subdomain}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <GitBranch size={12} /> {component.repoUrl.split('/').pop()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> Port: {component.port}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Environment Status */}
      <div className="flex items-center gap-6 self-end sm:self-auto">
        {loading ? (
           // Simple loading spinner or skeleton
           <Loader2 size={16} className="animate-spin text-slate-300" />
        ) : (
          <div className="flex gap-6">
            <EnvStatus env="DEV" isRunning={status?.DEV} />
            <EnvStatus env="STG" isRunning={status?.STG} />
            <EnvStatus env="PROD" isRunning={status?.PROD} />
          </div>
        )}
        
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};