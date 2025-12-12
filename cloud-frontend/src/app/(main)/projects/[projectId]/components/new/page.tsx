"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Layers, Save, GitBranch, Globe, Terminal, Lock 
} from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function NewComponentPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    repoUrl: "",
    branch: "main",
    buildPath: ".",
    port: "8080", // String for input, convert to int for API
    gitToken: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (!formData.name || !formData.subdomain || !formData.repoUrl) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      // POST /api/components/project/{projectId}
      await api.post(`/api/components/project/${projectId}`, {
        ...formData,
        port: parseInt(formData.port), // Ensure port is integer
      });

      // Navigate back to Project Details on success
      router.refresh();
      router.push(`/projects/${projectId}`);
      
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create component. Check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* 1. Header Navigation */}
      <div className="mb-6">
        <Link 
          href={`/projects/${projectId}`} 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Project
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          
          {/* 2. Main Title Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">New Component</h1>
              <p className="text-sm text-slate-500">Deploy a new microservice or application.</p>
            </div>
          </div>

          {/* 3. Identity Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe size={16} className="text-slate-400" /> Identity & Routing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Component Name"
                name="name"
                placeholder="e.g. Frontend App"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Subdomain</label>
                <div className="flex">
                  <input
                    name="subdomain"
                    placeholder="my-app"
                    className="flex-1 px-4 py-2.5 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.subdomain}
                    onChange={handleChange}
                    required
                  />
                  <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-r-lg text-slate-500 text-sm flex items-center">
                    .cloud-deploy.com
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">This will be your internal access URL.</p>
              </div>
            </div>
          </div>

          {/* 4. Source Control Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <GitBranch size={16} className="text-slate-400" /> Source Control
            </h2>
            <div className="space-y-4">
              <Input
                label="Repository URL"
                name="repoUrl"
                placeholder="https://github.com/username/repo.git"
                value={formData.repoUrl}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Branch"
                  name="branch"
                  placeholder="main"
                  value={formData.branch}
                  onChange={handleChange}
                />
                <Input
                  label="Git Token (Optional)"
                  name="gitToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  icon={<Lock size={16} />}
                  value={formData.gitToken}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* 5. Runtime Config Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal size={16} className="text-slate-400" /> Runtime Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Build Path"
                name="buildPath"
                placeholder="."
                value={formData.buildPath}
                onChange={handleChange}
              />
              <Input
                label="Container Port"
                name="port"
                type="number"
                placeholder="8080"
                value={formData.port}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Link href={`/projects/${projectId}`}>
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </Link>
            <Button 
              type="submit" 
              isLoading={isLoading}
              className="w-auto px-8 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
            >
              <Save size={18} className="mr-2" />
              Create Component
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
}