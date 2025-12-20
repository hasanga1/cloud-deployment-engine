"use client";

import React from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const EmptyOrgState = () => {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Building2 size={40} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        No Organization Found
      </h2>
      <p className="text-slate-500 max-w-md mb-8">
        You aren&apos;t a member of any organization yet. Create one to start
        deploying your applications.
      </p>
      <Link href="/dashboard/create-org">
        <Button className="px-8 shadow-lg shadow-blue-500/20">
          <Plus size={18} className="mr-2" />
          Create Organization
        </Button>
      </Link>
    </div>
  );
};