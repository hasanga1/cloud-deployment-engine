"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    repoUrl: '',
    branch: 'main',
    buildPath: '.',
    port: 8080
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send data to backend
      await api.post('/api/projects', formData);
      router.push('/dashboard'); // Success! Go back home
    } catch (err: unknown) {
      // Display backend error (e.g., "Subdomain already taken")
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { data?: unknown } }).response;
        const data = resp?.data;
        if (typeof data === 'string') {
          setError(data);
        } else if (data !== undefined) {
          setError(JSON.stringify(data));
        } else {
          setError("Failed to create project");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err) || "Failed to create project");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
          <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Project Name & Subdomain */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input 
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                  placeholder="My Cool App"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subdomain</label>
                <div className="flex items-center">
                  <input 
                    required
                    pattern="^[a-z0-9-]+$"
                    className="w-full bg-gray-900 border border-gray-700 rounded-l p-2 focus:border-blue-500 outline-none"
                    placeholder="my-app"
                    value={formData.subdomain}
                    onChange={e => setFormData({...formData, subdomain: e.target.value.toLowerCase()})}
                  />
                  <span className="bg-gray-700 p-2 border border-gray-700 rounded-r text-gray-400">.localhost</span>
                </div>
              </div>
            </div>

            {/* Git Config */}
            <div>
              <label className="block text-sm font-medium mb-2">Git Repository URL</label>
              <input 
                required
                type="url"
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                placeholder="https://github.com/username/repo.git"
                value={formData.repoUrl}
                onChange={e => setFormData({...formData, repoUrl: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div>
                <label className="block text-sm font-medium mb-2">Branch</label>
                <input 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Build Path</label>
                <input 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                  placeholder="." // Default to root
                  value={formData.buildPath}
                  onChange={e => setFormData({...formData, buildPath: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Port</label>
                <input 
                  type="number"
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                  value={formData.port}
                  onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex justify-center items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : <><Save size={20}/> Create Project</>}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}