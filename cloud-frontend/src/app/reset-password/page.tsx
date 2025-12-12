"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
// --- IMPORTS FOR REUSABLE LOGIC ---
import { usePasswordValidation } from "@/app/hooks/usePasswordValidation";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errorTarget, setErrorTarget] = useState<"password" | "confirmPassword" | "general" | "">("");

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });

  // --- REPLACED DUPLICATE LOGIC WITH HOOK ---
  const { criteria, isValid: isPasswordValid } = usePasswordValidation(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) { setError(""); setErrorTarget(""); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError("Invalid or missing reset token."); setErrorTarget("general"); return; }
    if (!isPasswordValid) { setError("Please meet all password requirements."); setErrorTarget("password"); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); setErrorTarget("confirmPassword"); return; }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token: token, newPassword: formData.password });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
      setErrorTarget("general");
    } finally { setIsLoading(false); }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6"><AlertCircle size={32} /></div>
        <h2 className="text-xl font-bold text-slate-800">Invalid Link</h2>
        <p className="text-slate-500 mt-2 mb-6">This password reset link is invalid or missing the token.</p>
        <Button onClick={() => router.push("/auth")}>Return to Login</Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6"><CheckCircle2 size={32} /></div>
        <h2 className="text-xl font-bold text-slate-800">Password Reset!</h2>
        <p className="text-slate-500 mt-2 mb-6">Your password has been successfully updated.</p>
        <Button onClick={() => router.push("/auth")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30"><Lock size={24} /></div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Set New Password</h1>
        <p className="text-slate-500 text-sm mt-2">Create a strong password to secure your account.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <Input label="New Password" type="password" name="password" placeholder="New strong password" icon={<Lock size={18} />} value={formData.password} onChange={handleChange} error={errorTarget === "password" ? error : ""} required />
        
        {/* REUSABLE COMPONENT HERE */}
        <PasswordStrengthIndicator criteria={criteria} />

        <Input label="Verify New Password" type="password" name="confirmPassword" placeholder="Confirm new password" icon={<Lock size={18} />} value={formData.confirmPassword} onChange={handleChange} error={errorTarget === "confirmPassword" ? error : ""} required />
        {errorTarget === "general" && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg text-center border border-red-100">{error}</p>}
        <Button isLoading={isLoading}>Reset Password <ArrowRight size={16} /></Button>
        <button type="button" onClick={() => router.push("/auth")} className="w-full mt-6 text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">Cancel and return to login</button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
      </div>
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 z-10 relative transition-all duration-300">
        <Suspense fallback={<div className="text-center p-4 text-slate-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}