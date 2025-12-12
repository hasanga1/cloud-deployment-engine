"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { NavSelector } from "./NavSelector";
import { IOrganization, IProject, IComponent } from "@/types";

export const Header = () => {
  const router = useRouter();
  const {
    // Data Lists
    orgs,
    projects,
    components,
    // Selection States
    selectedOrg,
    selectedProject,
    selectedComponent,
    // Actions
    selectOrg,
    selectProject,
    selectComponent,
    isLoading,
  } = useDashboard();

  // --- Handlers: State Update + Navigation ---

  const handleOrgSelect = (org: IOrganization) => {
    selectOrg(org);
    selectProject(null);
    selectComponent(null);
    router.push("/overview");
  };

  const handleProjectSelect = (proj: IProject) => {
    selectProject(proj);
    selectComponent(null);
    router.push(`/projects/${proj.id}`);
  };

  const handleComponentSelect = (comp: IComponent) => {
    selectComponent(comp);
    if (selectedProject) {
      router.push(`/projects/${selectedProject.id}/components/${comp.id}`);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* --- Breadcrumb State Machine --- */}
      <div className="flex items-center">
        {/* 1. Organization (Always Visible) */}
        {selectedOrg === null ? (
          <NavSelector
            mode="trigger"
            labelTitle="Organization"
            items={orgs}
            onSelect={handleOrgSelect}
            placeholder="Select Organization..."
          />
        ) : (
          <NavSelector
            mode="value"
            labelTitle="Organization"
            currentValue={selectedOrg.name}
            items={orgs}
            onSelect={handleOrgSelect}
            placeholder="Switch Organization..."
            href="/overview"
          />
        )}

        {/* 2. Project Selection */}
        {selectedOrg && selectedProject === null && projects.length > 0 && (
          // State: [Org] [>]
          <NavSelector
            mode="trigger"
            labelTitle="Project"
            items={projects}
            onSelect={handleProjectSelect}
            placeholder="Select Project..."
          />
        )}

        {selectedOrg && selectedProject !== null && (
          // State: [Org] [Project]
          <>
            <div className="w-2" />
            <NavSelector
              mode="value"
              labelTitle="Project"
              currentValue={selectedProject.name}
              items={projects}
              onSelect={handleProjectSelect}
              placeholder="Switch Project..."
              href={`/projects/${selectedProject.id}`}
            />
          </>
        )}

        {/* 3. Component Selection */}
        {selectedProject !== null &&
          selectedComponent === null &&
          components.length > 0 && (
            // State: [Org] [Project] [>]
            <NavSelector
              mode="trigger"
              labelTitle="Component"
              items={components}
              onSelect={handleComponentSelect}
              placeholder="Select Component..."
            />
          )}

        {selectedProject !== null && selectedComponent !== null && (
          // State: [Org] [Project] [Component]
          <>
            <div className="w-2" />
            <NavSelector
              mode="value"
              labelTitle="Component"
              currentValue={selectedComponent.name}
              items={components}
              onSelect={handleComponentSelect}
              placeholder="Switch Component..."
              href={`/projects/${selectedProject.id}/components/${selectedComponent.id}`}
            />
          </>
        )}
      </div>

      {/* --- Right Actions --- */}
      <div className="flex items-center gap-4">
        <button className="relative p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
          <Bell size={20} />
          <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
};
