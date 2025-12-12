"use client";

import React, { useEffect, useState } from "react";
import { Layers, Clock, GitBranch, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { IComponent } from "@/types";
import { useDashboard } from "@/context/DashboardContext";
import { formatDate } from "@/lib/utils/dateUtils";

// --- Status Dot Component ---
const StatusDot = ({ env, active }: { env: string; active: boolean }) => {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{env}</span>
      {/* Filled Circle: Green if true, Red if false */}
      <div 
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          active 
            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
            : "bg-red-400 opacity-40"
        }`} 
      />
    </div>
  );
};

export const ComponentCard = ({ component }: { component: IComponent }) => {
  const router = useRouter();
  const [status, setStatus] = useState({ DEV: false, STG: false, PROD: false });
  const [loading, setLoading] = useState(true);
  const { selectComponent } = useDashboard();

  const handleComponentClick = (component: IComponent) => {
    selectComponent(component);
    router.push(`/projects/${component.project.id}/components/${component.id}`);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/api/components/${component.id}/status`);
        if (isMounted) setStatus(res.data);
      } catch (error) {
        console.error("Failed to fetch component status", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, [component.id]);

  return (
    <div 
      // Navigate to component details (placeholder route for now)
      onClick={() => handleComponentClick(component)}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-blue-300 transition-colors cursor-pointer"
    >
      
      {/* Left: Component Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
          <Layers size={22} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            {component.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              <Clock size={12} /> 
              {formatDate(component.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch size={12} /> {component.branch}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Environment Status Dots */}
      <div className="flex items-center gap-6 self-end sm:self-auto">
        {loading ? (
           <div className="flex gap-4">
             {[1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-2 w-6 bg-slate-100 rounded"/> 
                    <div className="w-3 h-3 bg-slate-100 rounded-full animate-pulse"/>
                </div>
             ))}
           </div>
        ) : (
          <div className="flex gap-6">
            <StatusDot env="DEV" active={status.DEV} />
            <StatusDot env="STG" active={status.STG} />
            <StatusDot env="PROD" active={status.PROD} />
          </div>
        )}

        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full ml-2">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};