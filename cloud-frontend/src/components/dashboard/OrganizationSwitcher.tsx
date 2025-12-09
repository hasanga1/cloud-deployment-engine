"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronsUpDown, Check, PlusCircle, Building2 } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { IOrganization } from "@/types";

export const OrganizationSwitcher = () => {
  const { orgs, selectedOrg, setSelectedOrg, isLoading } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (org: IOrganization) => {
    setSelectedOrg(org);
    setIsOpen(false);
  };

  if (isLoading) return <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />;

  return (
    <div className="p-4 relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-left group ${
          isOpen ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {selectedOrg ? selectedOrg.name.substring(0, 2).toUpperCase() : <Building2 size={16} />}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-700 truncate w-28">
              {selectedOrg?.name || "Select Org"}
            </p>
            <p className="text-xs text-slate-500 truncate">Free Plan</p>
          </div>
        </div>
        <ChevronsUpDown size={16} className="text-slate-400 group-hover:text-slate-600" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-lg border border-slate-200 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            <p className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase">Organizations</p>
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelect(org)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {org.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span className={`truncate w-32 ${selectedOrg?.id === org.id ? "font-medium text-slate-900" : "text-slate-600"}`}>
                    {org.name}
                  </span>
                </div>
                {selectedOrg?.id === org.id && <Check size={14} className="text-blue-600" />}
              </button>
            ))}
            <div className="h-px bg-slate-100 my-1"></div>
            <Link href="/dashboard/create-org" className="w-full flex items-center gap-2 px-2 py-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              <PlusCircle size={14} />
              <span>Create Organization</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};