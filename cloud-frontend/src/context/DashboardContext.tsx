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
  selectOrg: (org: IOrganization | null) => void;
  selectProject: (proj: IProject | null) => void;
  selectComponent: (comp: IComponent | null) => void;
  isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// LocalStorage keys
const STORAGE_KEYS = {
  ORG_ID: 'selected_org_id',
  PROJECT_ID: 'selected_project_id',
  COMPONENT_ID: 'selected_component_id',
};

export const DashboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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

  // Helper: Get from localStorage
  const getStoredId = (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  // Helper: Save to localStorage
  const storeId = (key: string, id: string | number | null) => {
    if (typeof window !== 'undefined') {
      if (id === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, String(id));
      }
    }
  };

  // Initial Load: Fetch User & Orgs, then restore selections
  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      try {
        // 1. Parallel Fetch: User + Orgs
        const [userRes, orgsRes] = await Promise.all([
          api.get("/auth/user"),
          api.get("/api/orgs"),
        ]);
        
        setUser(userRes.data);
        setOrgs(orgsRes.data);

        // 2. Restore selected org from localStorage
        const storedOrgId = getStoredId(STORAGE_KEYS.ORG_ID);
        if (storedOrgId && orgsRes.data.length > 0) {
          const restoredOrg = orgsRes.data.find((o: IOrganization) => String(o.id) === storedOrgId);
          if (restoredOrg) {
            setSelectedOrg(restoredOrg);
          } else {
            // Stored org not found, select first
            setSelectedOrg(orgsRes.data[0]);
            storeId(STORAGE_KEYS.ORG_ID, orgsRes.data[0].id);
          }
        } else if (orgsRes.data.length > 0) {
          // No stored org, select first
          setSelectedOrg(orgsRes.data[0]);
          storeId(STORAGE_KEYS.ORG_ID, orgsRes.data[0].id);
        }
      } catch (e) {
        console.error("Failed to init dashboard", e);
      } finally {
        setIsLoading(false);
      }
    };
    initDashboard();
  }, []);

  // 2. When Org Changes -> Fetch Projects & Restore Project Selection
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedOrg) return;

      setProjects([]);
      setComponents([]);
      
      try {
        const res = await api.get(`/api/projects/org/${selectedOrg.id}`);
        setProjects(res.data);

        // Restore selected project from localStorage
        const storedProjectId = getStoredId(STORAGE_KEYS.PROJECT_ID);
        if (storedProjectId && res.data.length > 0) {
          const restoredProject = res.data.find((p: IProject) => String(p.id) === storedProjectId);
          if (restoredProject) {
            setSelectedProject(restoredProject);
          } else {
            // Stored project not found in this org
            setSelectedProject(null);
            localStorage.removeItem(STORAGE_KEYS.PROJECT_ID);
          }
        }
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    };

    fetchProjects();
  }, [selectedOrg]);

  // 3. When Project Changes -> Fetch Components & Restore Component Selection
  useEffect(() => {
    const fetchComponents = async () => {
      if (!selectedProject) {
        setComponents([]);
        setSelectedComponent(null);
        return;
      }

      setComponents([]);
      
      try {
        const res = await api.get(`/api/components/project/${selectedProject.id}`);
        setComponents(res.data);

        // Restore selected component from localStorage
        const storedComponentId = getStoredId(STORAGE_KEYS.COMPONENT_ID);
        if (storedComponentId && res.data.length > 0) {
          const restoredComponent = res.data.find((c: IComponent) => String(c.id) === storedComponentId);
          if (restoredComponent) {
            setSelectedComponent(restoredComponent);
          } else {
            // Stored component not found in this project
            setSelectedComponent(null);
            localStorage.removeItem(STORAGE_KEYS.COMPONENT_ID);
          }
        }
      } catch (e) {
        console.error("Failed to fetch components", e);
      }
    };

    fetchComponents();
  }, [selectedProject]);

  // Wrapped setters that also persist to localStorage
  const handleSelectOrg = (org: IOrganization | null) => {
    setSelectedOrg(org);
    storeId(STORAGE_KEYS.ORG_ID, org?.id || null);
  };

  const handleSelectProject = (proj: IProject | null) => {
    setSelectedProject(proj);
    storeId(STORAGE_KEYS.PROJECT_ID, proj?.id || null);
  };

  const handleSelectComponent = (comp: IComponent | null) => {
    setSelectedComponent(comp);
    storeId(STORAGE_KEYS.COMPONENT_ID, comp?.id || null);
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        orgs,
        projects,
        components,
        selectedOrg,
        selectedProject,
        selectedComponent,
        selectOrg: handleSelectOrg,
        selectProject: handleSelectProject,
        selectComponent: handleSelectComponent,
        isLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};