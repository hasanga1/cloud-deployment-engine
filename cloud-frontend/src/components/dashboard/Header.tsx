"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { NavSelector } from "./NavSelector";

export const Header = () => {
  const {
    // Data Lists
    orgs, projects, components,
    // Selection States
    selectedOrg, selectedProject, selectedComponent,
    // Actions
    selectOrg, selectProject, selectComponent,
    isLoading
  } = useDashboard();

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* --- Breadcrumb State Machine --- */}
      <div className="flex items-center">
        
        {/* 1. Organization (Always Visible) */}
        {isLoading && !selectedOrg ? (
           <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse border border-slate-200" />
        ) : (
           <NavSelector
             mode="value"
             labelTitle="Organization"
             currentValue={selectedOrg?.name}
             items={orgs}
             onSelect={selectOrg}
             placeholder="Switch Org..."
           />
        )}

        {/* 2. Project Selection */}
        {selectedOrg && !selectedProject && (
          // State: [Org] [>]
          <NavSelector 
            mode="trigger"
            labelTitle="Project" // Label shown inside dropdown footer
            items={projects}
            onSelect={selectProject}
            placeholder="Select Project..."
          />
        )}

        {selectedOrg && selectedProject && (
          // State: [Org] [Project]
          <>
             {/* Divider hidden, we use margin on the buttons */}
             <div className="w-2" /> 
             <NavSelector
               mode="value"
               labelTitle="Project"
               currentValue={selectedProject.name}
               items={projects}
               onSelect={selectProject}
               placeholder="Switch Project..."
             />
          </>
        )}

        {/* 3. Component Selection */}
        {selectedProject && !selectedComponent && (
           // State: [Org] [Project] [>]
           <NavSelector 
             mode="trigger"
             labelTitle="Component"
             items={components}
             onSelect={selectComponent}
             placeholder="Select Component..."
           />
        )}

        {selectedProject && selectedComponent && (
            // State: [Org] [Project] [Component]
            <>
                <div className="w-2" />
                <NavSelector
                    mode="value"
                    labelTitle="Component"
                    currentValue={selectedComponent.name}
                    items={components}
                    onSelect={selectComponent}
                    placeholder="Switch Component..."
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