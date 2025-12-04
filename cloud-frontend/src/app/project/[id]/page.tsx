"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Play, Square, ExternalLink, ArrowLeft, Loader2, History } from 'lucide-react'; // Added icons
import Terminal from '@/components/Terminal';

interface Deployment {
  id: string;
  status: string;
  commitSha: string;
  commitMessage: string;
  createdAt: string;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [project, setProject] = useState<any>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Computed State: Find the currently running deployment
  const activeDeployment = deployments.find(d => d.status === 'SUCCESS');
  const isRunning = !!activeDeployment;

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const pRes = await api.get(`/api/projects/${id}`);
      setProject(pRes.data);
      
      const dRes = await api.get(`/api/projects/${id}/deployments`);
      setDeployments(dRes.data);
    } catch (e) {
      console.error("Error loading project data");
    }
  };

  // 1. STOP PROJECT (Stops the currently running container)
  const handleStop = async () => {
    if (!activeDeployment) return;
    
    if(!confirm("Are you sure you want to stop the running application?")) return;

    try {
      setLoading(true);
      await api.post(`/api/deployments/${activeDeployment.id}/stop`);
      // Wait a bit for DB to update then reload
      setTimeout(() => {
        loadData();
        setLoading(false);
      }, 1000);
    } catch (e) {
      alert("Failed to stop project");
      setLoading(false);
    }
  };

  // 2. DEPLOY (Triggers new build from latest code)
  const handleDeploy = async () => {
    setShowTerminal(true);
    try {
      await api.post(`/api/projects/${id}/deploy`);
      // Logs will show in terminal...
      // Reload history in background
      setTimeout(loadData, 2000);
    } catch (err) {
      alert("Deployment failed to start.");
    }
  };

  if (!project) return <div className="p-10 text-white flex gap-2"><Loader2 className="animate-spin"/> Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      
      {/* Navigation */}
      <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-white transition">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* HEADER SECTION: Project Info & CONTROLS */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8 shadow-lg">
        <div className="flex justify-between items-start">
          
          {/* Left: Info */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              {isRunning ? (
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold border border-green-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Running
                </span>
              ) : (
                <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded-full font-bold border border-gray-600">
                  Stopped
                </span>
              )}
            </div>
            
            <a href={`http://${project.subdomain}.localhost`} target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 mt-2 font-mono text-sm">
              {project.subdomain}.localhost <ExternalLink size={14} />
            </a>
            <div className="text-gray-500 text-sm mt-1">{project.repoUrl} ({project.branch})</div>
          </div>

          {/* Right: PROJECT CONTROLS (Stop / Deploy) */}
          <div className="flex gap-3">
            
            {/* STOP BUTTON */}
            <button 
                onClick={handleStop}
                disabled={!isRunning || loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold border transition
                  ${!isRunning 
                    ? 'bg-gray-700 text-gray-500 border-gray-700 cursor-not-allowed opacity-50' 
                    : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 active:scale-95'}
                `}
            >
               {loading ? <Loader2 size={18} className="animate-spin"/> : <Square size={18} fill={isRunning ? "currentColor" : "none"} />}
               Stop
            </button>

            {/* DEPLOY BUTTON */}
            <button 
                onClick={handleDeploy}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition active:scale-95"
            >
                <Play size={18} fill="currentColor" />
                Deploy
            </button>
          </div>

        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center gap-2">
            <History size={18} className="text-gray-400"/>
            <h3 className="font-semibold text-gray-200">Deployment History</h3>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4">Status</th>
              <th className="p-4">Deployment ID</th>
              <th className="p-4">Commit</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-sm">
            {deployments.map((d) => (
              <tr key={d.id} className="hover:bg-gray-750 transition-colors">
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    d.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    d.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    d.status === 'STOPPED' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-gray-500">
                    {d.id.substring(0,8)}...
                </td>
                <td className="p-4 font-mono">
                  <div className="text-gray-300">{d.commitSha ? d.commitSha.substring(0,7) : 'Latest'}</div>
                  <div className="text-gray-500 text-xs truncate max-w-[200px]">{d.commitMessage || '-'}</div>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(d.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            
            {deployments.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No deployments yet.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {showTerminal && <Terminal onClose={() => setShowTerminal(false)} />}
    </div>
  );
}