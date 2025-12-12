"use client";

import { Server, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { IProject } from "@/types";
import { useDashboard } from "@/context/DashboardContext";
import { formatDate } from "@/lib/utils/dateUtils";

export const ProjectCard = ({ project }: { project: IProject }) => {
  const router = useRouter();

  const { selectProject } = useDashboard();

  const handleProjectClick = (project: IProject) => {
    selectProject(project);
    router.push(`/projects/${project.id}`);
  };

  return (
    <div
      onClick={() => handleProjectClick(project)}
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
              {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
