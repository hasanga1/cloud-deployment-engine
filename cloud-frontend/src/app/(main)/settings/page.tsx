"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  LogOut, 
  Building2, 
  Save, 
  Loader2, 
  ShieldAlert,
  Mail
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button"; // Assuming you have this from your dashboard example
import { useDashboard } from "@/context/DashboardContext"; // To sync data if needed

interface Organization {
  id: number;
  name: string;
  role: string; // OWNER, ADMIN, MEMBER
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // Profile State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(""); // Read-only

  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Data Lists
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get User Profile
      const userRes = await api.get("/auth/user");
      setFirstName(userRes.data.firstName || "");
      setLastName(userRes.data.lastName || "");
      setEmail(userRes.data.email || "");

      // 2. Get Organizations (Make sure backend returns role!)
      const orgRes = await api.get("/api/orgs");
      
      // MAPPING: Ensure your backend DTO structure matches this
      // If backend returns just Org object, role might be missing unless you updated the controller as discussed.
      // We will handle safe access here.
      const formattedOrgs = orgRes.data.map((item: any) => ({
        id: item.organization?.id || item.id,
        name: item.organization?.name || item.name,
        role: item.role || "MEMBER" 
      }));
      
      setOrgs(formattedOrgs);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/auth/profile", { firstName, lastName });
      showMessage("Profile updated successfully", "success");
    } catch (err) {
      showMessage("Failed to update profile", "error");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/auth/password", { oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      showMessage("Password changed successfully", "success");
    } catch (err: any) {
      showMessage(err.response?.data || "Failed to change password", "error");
    }
  };

  const handleLeaveOrg = async (orgId: number) => {
    if (!confirm("Are you sure you want to leave this organization?")) return;
    try {
      await api.delete(`/api/orgs/${orgId}/leave`);
      setOrgs(orgs.filter((o) => o.id !== orgId));
      showMessage("Left organization successfully", "success");
    } catch (err: any) {
      showMessage(err.response?.data || "Could not leave organization", "error");
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your personal details and organization memberships.
        </p>
      </div>

      {/* Notification Toast */}
      {message.text && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? <ShieldAlert size={18} /> : <ShieldAlert size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* 1️⃣ PROFILE CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
            <p className="text-xs text-slate-500">Update your public profile details.</p>
          </div>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">Email Address</label>
             <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
             </div>
             <p className="text-xs text-slate-400">Email address cannot be changed.</p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20">
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* 2️⃣ SECURITY CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Security</h2>
            <p className="text-xs text-slate-500">Manage your password and account access.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-6 max-w-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="text-xs text-slate-400">
              Must be at least 8 characters with 1 number and 1 symbol.
            </p>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="outline" className="text-slate-700 border-slate-300 hover:bg-slate-50">
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* 3️⃣ ORGANIZATIONS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">My Organizations</h2>
            <p className="text-xs text-slate-500">Organizations you are a member of.</p>
          </div>
        </div>

        <div className="p-6">
          {orgs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p>You are not a member of any organization.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{org.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          org.role === "OWNER" 
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {org.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLeaveOrg(org.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut size={14} className="mr-1.5" />
                    Leave
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}