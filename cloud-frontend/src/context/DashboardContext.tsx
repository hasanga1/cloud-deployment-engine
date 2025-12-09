"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { IOrganization, IProject, IComponent, IUser } from "@/types";

interface DashboardContextType {
  // User Profile
  user: IUser | null;

  // Lists
  orgs: IOrganization[];
  projects: IProject[];
  components: IComponent[];

  // Selected Items
  selectedOrg: IOrganization | null;
  selectedProject: IProject | null;
  selectedComponent: IComponent | null;

  // Actions
  selectOrg: (org: IOrganization) => void;
  selectProject: (proj: IProject) => void;
  selectComponent: (comp: IComponent) => void;

  isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  // User State
  const [user, setUser] = useState<IUser | null>(null);

  // Data State
  const [orgs, setOrgs] = useState<IOrganization[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [components, setComponents] = useState<IComponent[]>([]);

  // Selection State
  const [selectedOrg, setSelectedOrg] = useState<IOrganization | null>(null);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<IComponent | null>(null);

  // Initial Load: Fetch User & Orgs
  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      try {
        // 1. Parallel Fetch: User + Orgs
        const [userRes, orgsRes] = await Promise.all([
          api.get("/auth/user"),
          api.get("/api/orgs")
        ]);

        setUser(userRes.data);
        setOrgs(orgsRes.data);
        
        // Default select first org
        if (orgsRes.data.length > 0) {
          setSelectedOrg(orgsRes.data[0]);
        }
      } catch (e) {
        console.error("Failed to init dashboard", e);
      } finally {
        setIsLoading(false);
      }
    };
    initDashboard();
  }, []);

  // ... (Keep existing effects for fetching projects/components on selection change)

  // 2. When Org Changes -> Fetch Projects
  useEffect(() => {
    setProjects([]);
    setComponents([]);
    setSelectedProject(null);
    setSelectedComponent(null);

    if (selectedOrg) {
      api.get(`/api/projects/org/${selectedOrg.id}`)
         .then(res => setProjects(res.data))
         .catch(console.error);
    }
  }, [selectedOrg]);

  // 3. When Project Changes -> Fetch Components
  useEffect(() => {
    setComponents([]);
    setSelectedComponent(null);

    if (selectedProject) {
      api.get(`/api/components/project/${selectedProject.id}`)
         .then(res => setComponents(res.data))
         .catch(console.error);
    }
  }, [selectedProject]);

  return (
    <DashboardContext.Provider 
      value={{
        user,
        orgs, projects, components,
        selectedOrg, selectedProject, selectedComponent,
        selectOrg: setSelectedOrg,
        selectProject: setSelectedProject,
        selectComponent: setSelectedComponent,
        isLoading
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};