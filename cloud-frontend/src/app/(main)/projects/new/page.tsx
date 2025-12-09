"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Box, Save, Loader2 } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import api from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const { selectedOrg } = useDashboard();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsLoading(true);
    try {
      // API call to create project
      await api.post(`/api/projects/org/${selectedOrg.id}`, {
        name: formData.name,
        description: formData.description
      });
      
      // Redirect back to overview on success
      router.refresh(); 
      router.push("/overview");
      
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Guard clause if org isn't loaded yet
  if (!selectedOrg) {
      return (
        <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400">
             <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
             <p>Loading Organization...</p>
        </div>
      );
  }

  return (
    // Animation Wrapper
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out">
      
      {/* Back Link */}
      <div className="mb-6">
        <Link 
          href="/overview" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Overview
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        
        {/* Card Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <Box size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create New Project</h1>
            <p className="text-sm text-slate-500">Initialize a workspace for your services in <span className="font-semibold text-slate-700">{selectedOrg.name}</span>.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-4">
            <Input
              label="Project Name"
              name="name"
              placeholder="e.g. e-commerce-backend"
              value={formData.name}
              onChange={handleChange}
              autoFocus
              required
            />
            
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Description (Optional)</label>
              <textarea
                name="description"
                rows={4}
                placeholder="Brief description of what this project does..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center justify-center font-medium animate-in fade-in duration-300">
              {error}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
            <Link href="/overview">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </Link>
            
            <Button 
              type="submit" 
              isLoading={isLoading} 
              className="w-auto px-6 py-2.5 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {!isLoading && <Save size={18} className="mr-2" />}
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}