"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus, Mail, MoreVertical, Search } from "lucide-react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { Button } from "@/components/ui/Button";
import { EmptyOrgState } from "@/components/dashboard/EmptyOrgState";

// --- Types ---
interface OrgMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "VIEWER";
}

// --- Helper: Role Badge ---
const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-700 border-purple-200",
    ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
    DEVELOPER: "bg-green-100 text-green-700 border-green-200",
    VIEWER: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        styles[role] || styles.VIEWER
      }`}
    >
      {role}
    </span>
  );
};

export default function MembersPage() {
  const { selectedOrg, orgs, isLoading: isGlobalLoading } = useDashboard();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedOrg) return;

      setIsLoading(true);
      try {
        const res = await api.get(`/api/orgs/${selectedOrg.id}/members`);
        setMembers(res.data);
      } catch (error) {
        console.error("Failed to fetch members", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [selectedOrg]);

  // Client-side filtering
  const filteredMembers = members.filter(
    (m) =>
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for Avatar Initials
  const getInitials = (first: string, last: string) => {
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  // --- 1. Global Loading ---
  if (isGlobalLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Loading organization details...</p>
      </div>
    );
  }

  // --- 2. No Organization State (Reuse) ---
  if (orgs.length === 0) {
    return <EmptyOrgState />;
  }

  // --- 3. Org Switching State ---
  if (!selectedOrg) {
    return (
      <div className="h-[80vh] flex items-center justify-center flex-col text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Loading Members...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
          <p className="text-slate-500 mt-1">
            Manage access and roles for{" "}
            <span className="font-semibold text-slate-700">
              {selectedOrg.name}
            </span>
            .
          </p>
        </div>
        <Button className="shadow-lg shadow-blue-500/20">
          <UserPlus size={18} className="mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr
                  key={member.userId}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {member.firstName} {member.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Mail size={12} /> {member.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <RoleBadge role={member.role} />
                  </td>

                  {/* Status (Mocked for now as 'Active') */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-slate-600">Active</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filteredMembers.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <p>No members found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
