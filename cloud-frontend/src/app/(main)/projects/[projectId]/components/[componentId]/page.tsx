"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Globe,
  GitBranch,
  Clock,
  Trash2,
  Loader2,
  Play,
  Square,
  Hash,
  GitCommit,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import {
  IComponent,
  IDeployment,
  AppEnvironment,
  DeploymentStatus,
} from "@/types";
import { useDashboard } from "@/context/DashboardContext";
import { formatDate } from "@/lib/utils/dateUtils";

// --- Helper: Status Badge ---
const StatusBadge = ({ status }: { status: DeploymentStatus }) => {
  const styles = {
    [DeploymentStatus.RUNNING]: "bg-green-100 text-green-700 border-green-200",
    [DeploymentStatus.IN_PROGRESS]:
      "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
    [DeploymentStatus.QUEUED]: "bg-amber-100 text-amber-700 border-amber-200",
    [DeploymentStatus.FAILED]: "bg-red-100 text-red-700 border-red-200",
    [DeploymentStatus.STOPPED]: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        styles[status] || styles.STOPPED
      }`}
    >
      {status}
    </span>
  );
};

export default function ComponentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { projectId, componentId } = params;

  // Context Actions for Header Sync
  const { selectProject, selectComponent } = useDashboard();

  // State
  const [component, setComponent] = useState<IComponent | null>(null);
  const [deployments, setDeployments] = useState<IDeployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Loading states for specific actions
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // e.g. "DEV-deploy"

  // 1. Fetch Data & Sync Header
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, deployRes] = await Promise.all([
          api.get(`/api/components/${componentId}`),
          api.get(`/api/components/${componentId}/deployments`),
        ]);

        const compData = compRes.data;
        setComponent(compData);
        setDeployments(deployRes.data);
      } catch (error) {
        console.error("Failed to load component", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (componentId) fetchData();
  }, [componentId, selectProject, selectComponent]);

  // 2. Helper to get latest deployment for an Env
  const getLatestDeployment = (env: AppEnvironment) => {
    return deployments
      .filter((d) => d.environment === env)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
  };

  // 3. Actions
  const handleDeploy = (env: AppEnvironment) => {
    // Navigate to the deployment wizard
    router.push(
      `/projects/${projectId}/components/${componentId}/deploy?env=${env}`
    );
  };

  const handleStop = async (deploymentId: string, env: AppEnvironment) => {
    if (!deploymentId) return;
    setActionLoading(`${env}-stop`);
    try {
      await api.post(`/api/deployments/${deploymentId}/stop`);

      // Refetch
      const res = await api.get(`/api/components/${componentId}/deployments`);
      setDeployments(res.data);
    } catch (error) {
      alert("Failed to stop instance");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteComponent = async () => {
    if (
      !confirm(
        "Are you sure? This will delete the component and stop all running instances."
      )
    )
      return;
    setIsDeleting(true);
    try {
      // Mock API delete call (replace with real one when available)
      // await api.delete(`/api/components/${componentId}`);
      await new Promise((r) => setTimeout(r, 1000));

      selectComponent(null); // Clear context
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      alert("Failed to delete component");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Loading component details...</p>
      </div>
    );
  }

  if (!component) return <div>Component not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* --- 1. Top Navigation --- */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Project
        </Link>

        {/* --- 2. Component Header Card --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
              <Layers size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-800 truncate">
                {component.name}
              </h1>

              {/* Description Placeholder */}
              <p className="text-slate-500 mt-1 text-sm">
                No description provided.
                <span className="text-slate-300 mx-2">|</span>
                <a
                  href={component.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  <GitBranch size={12} className="mr-1" />
                  {component.repoUrl}
                </a>
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                  <Globe size={14} className="text-slate-400" />
                  <span className="font-mono text-xs">
                    {component.subdomain}.cloud-deploy.com
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  <span>
                    Created{" "}
                    {formatDate(
                      new Date(component.createdAt).toLocaleDateString()
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Action */}
          <button
            onClick={handleDeleteComponent}
            disabled={isDeleting}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0 self-start lg:self-center"
            title="Delete Component"
          >
            {isDeleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>

      {/* --- 3. Environments Grid --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Environments</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[AppEnvironment.DEV, AppEnvironment.STG, AppEnvironment.PROD].map(
            (env) => {
              const deployment = getLatestDeployment(env);
              const isRunning =
                deployment?.status === DeploymentStatus.RUNNING ||
                deployment?.status === DeploymentStatus.IN_PROGRESS;

              // Loading states
              const isDeploying = actionLoading === `${env}-deploy`;
              const isStopping = actionLoading === `${env}-stop`;

              return (
                <div
                  key={env}
                  className="bg-white flex flex-col rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full"
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ring-2 ${
                          isRunning
                            ? "bg-green-500 ring-green-100"
                            : "bg-slate-300 ring-slate-100"
                        }`}
                      />
                      <span className="font-bold text-slate-700 tracking-wide">
                        {env}
                      </span>
                    </div>
                    {deployment && <StatusBadge status={deployment.status} />}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-6">
                    {deployment ? (
                      <div className="space-y-4">
                        {/* Build Info */}
                        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-50">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Hash size={14} />
                            <span>Build ID</span>
                          </div>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {deployment.id.substring(0, 8)}
                          </span>
                        </div>

                        {/* Commit Info */}
                        <div className="flex gap-3">
                          <GitCommit
                            size={18}
                            className="text-slate-400 mt-0.5 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-snug">
                              {deployment.commitMessage || "No commit message"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {deployment.commitSha?.substring(0, 7) ||
                                  "HEAD"}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(
                                  deployment.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                        <Clock size={24} className="mb-2 opacity-30" />
                        <span className="text-sm font-medium opacity-60">
                          Not deployed
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div>
                      {isRunning ? (
                        <Button
                          variant="outline"
                          onClick={() => handleStop(deployment.id, env)}
                          isLoading={isStopping}
                          disabled={isStopping || isDeploying}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <Square size={14} className="mr-2 fill-current" />
                          Stop Instance
                        </Button>
                      ) : (
                        <Button
                          variant="primary" // Default blue
                          onClick={() => handleDeploy(env)}
                          isLoading={isDeploying}
                          disabled={isDeploying || isStopping}
                          className="w-full"
                        >
                          <Play size={14} className="mr-2 fill-current" />
                          Deploy to {env}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
