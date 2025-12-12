"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Box, Loader2, Calendar, LayoutGrid, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { IProject, IComponent } from "@/types";
import { Button } from "@/components/ui/Button";
import { ComponentCard } from "@/components/dashboard/ComponentCard";
import { useDashboard } from "@/context/DashboardContext";

export default function ProjectComponentsPage() {
  const params = useParams();
  const projectId = params.projectId;
  const router = useRouter();

  const { selectProject, selectComponent } = useDashboard();

  const [project, setProject] = useState<IProject | null>(null);
  const [components, setComponents] = useState<IComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectRes, componentsRes] = await Promise.all([
          api.get(`/api/projects/${projectId}`),
          api.get(`/api/components/project/${projectId}`),
        ]);

        const projectData = projectRes.data;
        setProject(projectData);
        setComponents(componentsRes.data);
      } catch (error) {
        console.error("Failed to load project details", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) fetchData();
  }, [projectId, selectProject]);

  // --- Handlers ---

  const handleNewComponent = () => {
    selectComponent(null);
    router.push(`/projects/${projectId}/components/new`);
  };

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    setIsDeleting(true);
    try {
      // await api.delete(`/api/projects/${projectId}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      selectProject(null);
      router.push("/overview");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete project", error);
      alert("Failed to delete project");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Back Link */}
      <div>
        {/* Project Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Box size={28} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 truncate">
                {project.name}
              </h1>
              <p className="text-slate-500 mt-1 max-w-2xl leading-relaxed text-sm">
                {project.description ||
                  "No description provided for this project."}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> Created{" "}
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <LayoutGrid size={14} /> {components.length} Component
                  {components.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <button
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete Project"
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>

            <Button
              onClick={handleNewComponent} // 3. Use the new handler
              className="shadow-lg shadow-blue-500/20 w-auto px-4 cursor-pointer"
            >
              <Plus size={18} className="mr-2" />
              New Component
            </Button>
          </div>
        </div>
      </div>

      {/* Components List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          Components
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">
            {components.length}
          </span>
        </h2>

        {components.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <Box size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              No components yet
            </h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-6">
              Add your first microservice, frontend, or database to this
              project.
            </p>
            <Button
              variant="outline"
              onClick={handleNewComponent} // Use handler here too
            >
              Add Component
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {components.map((comp) => (
              <ComponentCard key={comp.id} component={comp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
