"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { IUser, IOrganization } from "@/types";
import { fakeApi } from "@/lib/fakeapi"; // Fallback if needed

interface DashboardContextType {
  user: IUser | null;
  orgs: IOrganization[];
  selectedOrg: IOrganization | null;
  setSelectedOrg: (org: IOrganization) => void;
  isLoading: boolean;
  refreshContext: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [orgs, setOrgs] = useState<IOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<IOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch User (Real API)
      const userRes = await api.get("/auth/user");
      setUser(userRes.data);

      // 2. Fetch Orgs (Real API)
      const orgsRes = await api.get("/api/orgs");
      const orgsData = orgsRes.data;
      setOrgs(orgsData);

      // 3. Set Default Org
      if (orgsData.length > 0 && !selectedOrg) {
        setSelectedOrg(orgsData[0]);
      }
    } catch (error) {
      console.error("Failed to init dashboard context", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardContext.Provider 
      value={{ user, orgs, selectedOrg, setSelectedOrg, isLoading, refreshContext: fetchData }}
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