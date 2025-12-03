"use client";
import { useEffect, useState } from 'react'; // removed useCallback
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Rocket, Plus, ExternalLink } from 'lucide-react';
import Terminal from '@/components/Terminal';

interface Project {
  id: number;
  name: string;
  subdomain: string;
  repoUrl: string;
  status?: string; 
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    // Define the async function INSIDE the effect
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        setProjects(res.data);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };

    // Call it immediately
    fetchProjects();
  }, []); // Empty dependency array means this runs once on mount

  const handleDeploy = async (id: number) => {
    try {
      setShowTerminal(true);
      await api.post(`/api/projects/${id}/deploy`);
      alert("Deployment Triggered! Check the terminal.");
    } catch (err) {
      alert("Deployment failed to start.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <button 
            onClick={() => router.push('/project/new')} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            <Plus size={20} /> New Project
          </button>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="text-gray-400 text-sm">{project.repoUrl}</p>
                <a 
                  href={`http://${project.subdomain}.localhost`} 
                  target="_blank" 
                  className="text-blue-400 hover:underline text-sm flex items-center gap-1 mt-2"
                >
                  {project.subdomain}.localhost <ExternalLink size={14}/>
                </a>
              </div>
              
              <button 
                onClick={() => handleDeploy(project.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
              >
                <Rocket size={18} /> Deploy
              </button>
            </div>
          ))}

          {showTerminal && (
            <Terminal onClose={() => setShowTerminal(false)} />
         )}

          {projects.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No projects yet. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}