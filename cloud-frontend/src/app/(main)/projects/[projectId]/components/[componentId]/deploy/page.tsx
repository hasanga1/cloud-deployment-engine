"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AppEnvironment } from "@/types";

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface EnvVar {
  key: string;
  value: string;
}

export default function DeployPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = params.projectId;
  const componentId = params.componentId;
  const targetEnv =
    (searchParams.get("env") as AppEnvironment) || AppEnvironment.DEV;

  // Data State
  const [commits, setCommits] = useState<Commit[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }]);

  // Selection State
  const [selectedCommit, setSelectedCommit] = useState<string>("");

  // UI State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load (Commits + Existing Envs)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commitsRes, envsRes] = await Promise.all([
          api.get(`/api/components/${componentId}/commits`),
          api.get(`/api/components/${componentId}/envs`, {
            params: { env: targetEnv },
          }),
        ]);

        setCommits(commitsRes.data);

        // Populate existing envs if any
        const existingEnvs = envsRes.data; // { KEY: "VAL" }
        if (Object.keys(existingEnvs).length > 0) {
          const formatted = Object.entries(existingEnvs).map(
            ([key, value]) => ({
              key,
              value: String(value),
            })
          );
          setEnvVars(formatted);
        }

        // Auto-select latest commit
        if (commitsRes.data.length > 0) {
          setSelectedCommit(commitsRes.data[0].sha);
        }
      } catch (error) {
        console.error("Failed to load deploy data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [componentId, targetEnv]);

  // --- Handlers: Env Variables ---

  const handleEnvChange = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    const newVars = [...envVars];
    newVars[index][field] = val;
    setEnvVars(newVars);
  };

  const addEnvRow = () => setEnvVars([...envVars, { key: "", value: "" }]);

  const removeEnvRow = (index: number) => {
    const newVars = envVars.filter((_, i) => i !== index);
    setEnvVars(newVars.length ? newVars : [{ key: "", value: "" }]);
  };

  // --- Handlers: File Upload ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");

      const newEnvs: EnvVar[] = [];
      lines.forEach((line) => {
        // Simple .env parsing (KEY=VALUE)
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["'](.*)["']$/, "$1"); // Remove quotes
          newEnvs.push({ key, value });
        }
      });

      // Merge or Replace? Let's append for safety
      setEnvVars((prev) => {
        // Filter out empty rows first
        const cleanPrev = prev.filter((v) => v.key.trim() !== "");
        return [...cleanPrev, ...newEnvs];
      });
    };
    reader.readAsText(file);
  };

  // --- Final Deployment Logic ---

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      // 1. Prepare Env Map
      const envMap: Record<string, string> = {};
      envVars.forEach((v) => {
        if (v.key.trim()) envMap[v.key.trim()] = v.value;
      });

      // 2. Save Envs (Call API 1)
      await api.post(`/api/components/${componentId}/envs`, envMap, {
        params: { env: targetEnv },
      });

      // 3. Trigger Deployment (Call API 2)
      await api.post(
        `/api/components/${componentId}/deploy`,
        {
          commitSha: selectedCommit,
        },
        {
          params: { env: targetEnv },
        }
      );

      // 4. Redirect
      router.push(`/projects/${projectId}/components/${componentId}`);
    } catch (error) {
      alert("Deployment failed. Check console.");
      console.error(error);
      setIsDeploying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Preparing deployment configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}/components/${componentId}`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Cancel Deployment
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          Deploy to{" "}
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-lg border border-blue-200">
            {targetEnv}
          </span>
        </h1>
        <p className="text-slate-500 mt-2">
          Configure and launch a new build for your component.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: WIZARD --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: SELECT COMMIT */}
          <div
            className={`bg-white rounded-xl border transition-all duration-300 ${
              step === 1
                ? "border-blue-400 shadow-md ring-1 ring-blue-100"
                : "border-slate-200 opacity-60"
            }`}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                  1
                </div>
                Select Commit
              </h3>
              {step > 1 && (
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Change
                </Button>
              )}
            </div>

            {step === 1 && (
              <div className="max-h-80 overflow-y-auto p-2">
                {commits.map((commit) => (
                  <button
                    key={commit.sha}
                    onClick={() => setSelectedCommit(commit.sha)}
                    className={`w-full text-left p-4 rounded-lg mb-2 border transition-all cursor-pointer ${
                      selectedCommit === commit.sha
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        {commit.sha.substring(0, 7)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(commit.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 text-sm line-clamp-1">
                      {commit.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      by {commit.author}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: ENVIRONMENT VARIABLES */}
          <div
            className={`bg-white rounded-xl border transition-all duration-300 ${
              step === 2
                ? "border-blue-400 shadow-md ring-1 ring-blue-100"
                : "border-slate-200 opacity-60"
            }`}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                  2
                </div>
                Environment Variables
              </h3>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".env"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Upload size={12} /> Upload .env
                </button>
                {step > 2 && (
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Change
                  </Button>
                )}
              </div>
            </div>

            {step === 2 && (
              <div className="p-6 space-y-3">
                {envVars.map((env, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      placeholder="KEY"
                      value={env.key}
                      onChange={(e) =>
                        handleEnvChange(index, "key", e.target.value)
                      }
                      className="flex-1 px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm font-mono focus:border-blue-500 outline-none"
                    />
                    <input
                      placeholder="VALUE"
                      value={env.value}
                      onChange={(e) =>
                        handleEnvChange(index, "value", e.target.value)
                      }
                      className="flex-1 px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm font-mono focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={() => removeEnvRow(index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEnvRow}
                  className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 mt-2 cursor-pointer"
                >
                  <Plus size={16} /> Add Variable
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: SUMMARY & ACTION --- */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4">
              Deployment Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Target</span>
                <span className="font-bold text-slate-800">{targetEnv}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commit</span>
                <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-700">
                  {selectedCommit.substring(0, 7)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Variables</span>
                <span className="font-bold text-slate-800">
                  {envVars.filter((v) => v.key).length} keys
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              {step === 1 ? (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full cursor-pointer"
                >
                  Next: Configure Env
                </Button>
              ) : step === 2 ? (
                <Button
                  onClick={() => setStep(3)}
                  className="w-full cursor-pointer"
                >
                  Next: Review
                </Button>
              ) : (
                <Button
                  onClick={handleDeploy}
                  isLoading={isDeploying}
                  className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 cursor-pointer"
                >
                  <Play size={16} className="mr-2 fill-current" />
                  Start Deployment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
