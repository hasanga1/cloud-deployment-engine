"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Rocket, Plus, ExternalLink, GitCommit } from "lucide-react"; // Added GitCommit icon
import Terminal from "@/components/Terminal";

interface Project {
  id: number;
  name: string;
  subdomain: string;
  repoUrl: string;
  status?: string;
}

// 1. Define the Commit Interface (Fixes 'any' error)
interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  // Terminal State
  const [showTerminal, setShowTerminal] = useState(false);

  // Deployment State
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]); // 2. Use the interface here
  const [showCommitModal, setShowCommitModal] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");
        setProjects(res.data);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  // Step 1: Fetch commits when user clicks "Deploy"
  const handleDeployClick = async (projectId: number) => {
    setSelectedProject(projectId);
    try {
      const res = await api.get(`/api/projects/${projectId}/commits`);
      setCommits(res.data);
      setShowCommitModal(true); // Open the selection modal
    } catch (e) {
      alert("Failed to fetch commits. Is the repo public?");
    }
  };

  // Step 2: Trigger deployment with specific commit
  const confirmDeploy = async (commitSha: string) => {
    setShowCommitModal(false);
    setShowTerminal(true); // Open the logs
    try {
      await api.post(`/api/projects/${selectedProject}/deploy`, { commitSha });
    } catch (err) {
      alert("Deployment failed to start.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pb-96">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <button
            onClick={() => router.push("/project/new")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
          >
            <Plus size={20} /> New Project
          </button>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex justify-between items-center"
              onClick={() => router.push(`/project/${project.id}`)}
            >
              <div>
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="text-gray-400 text-sm">{project.repoUrl}</p>
                <a
                  href={`http://${project.subdomain}.localhost`}
                  target="_blank"
                  className="text-blue-400 hover:underline text-sm flex items-center gap-1 mt-2"
                >
                  {project.subdomain}.localhost <ExternalLink size={14} />
                </a>
              </div>

              {/* 3. This button is now CORRECTLY inside the map */}
              <button
                onClick={() => handleDeployClick(project.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium transition active:scale-95"
              >
                <Rocket size={18} /> Deploy
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No projects yet. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Terminal Overlay */}
      {showTerminal && <Terminal onClose={() => setShowTerminal(false)} />}

      {/* Commit Selection Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <GitCommit size={20} className="text-blue-400" /> Select Commit
              </h3>
            </div>

            <div className="overflow-y-auto p-4 space-y-3">
              {commits.map((c) => (
                <button
                  key={c.sha}
                  onClick={() => confirmDeploy(c.sha)}
                  className="w-full text-left p-3 hover:bg-gray-700 rounded border border-gray-700 transition group"
                >
                  <div className="font-mono font-bold text-blue-400 text-xs mb-1 group-hover:text-blue-300">
                    {c.sha.substring(0, 7)}
                  </div>
                  <div className="text-sm font-medium mb-1 truncate">
                    {c.message}
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{c.author}</span>
                    <span>{new Date(c.date).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
              {commits.length === 0 && (
                <p className="text-center text-gray-500">No commits found.</p>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <button
                onClick={() => setShowCommitModal(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
