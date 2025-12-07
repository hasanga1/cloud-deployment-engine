"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fakeApi } from "@/lib/fakeapi";
import api from "@/lib/api";

// Added new states to separate OTP check from Password Reset
type AuthView = 
  | "LOGIN" 
  | "REGISTER" 
  | "OTP_VERIFY" 
  | "FORGOT_REQUEST" 
  | "FORGOT_OTP"       // Step 2 of Forgot: Enter OTP
  | "FORGOT_NEW_PASS"; // Step 3 of Forgot: Enter New Password

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotLink, setShowForgotLink] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
  };

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fakeApi.login({ email: formData.email, password: formData.password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
      if(formData.password !== "") setShowForgotLink(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await fakeApi.register(formData);
      setView("OTP_VERIFY");
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP for Registration
  const handleRegisterOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fakeApi.verifyOtp(formData.otp);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid OTP. Try 123456");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Forgot Password: Request
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fakeApi.requestPasswordReset(formData.email);
      setView("FORGOT_OTP"); // Go to OTP step only
      setError("");
      // Clear OTP field in case it has old data
      setFormData(prev => ({ ...prev, otp: "" }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Forgot Password: Verify OTP
  const handleForgotOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Re-using verifyOtp for simulation
      await fakeApi.verifyOtp(formData.otp); 
      setView("FORGOT_NEW_PASS"); // Go to New Password step
      setError("");
    } catch (err: any) {
      setError("Invalid OTP. Try 123456");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Forgot Password: Set New Password
  const handlePassReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await fakeApi.resetPassword(formData);
      alert("Password reset successfully. Please login.");
      setView("LOGIN");
      setError("");
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "", otp: "" }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Helpers ---
  
  // Helper to generate dynamic titles
  const getTitle = () => {
    switch (view) {
      case "LOGIN": return "Welcome Back";
      case "REGISTER": return "Create Account";
      case "OTP_VERIFY": return "Verify Registration";
      case "FORGOT_REQUEST": return "Reset Password";
      case "FORGOT_OTP": return "Enter Code";
      case "FORGOT_NEW_PASS": return "New Password";
      default: return "Authentication";
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case "LOGIN": return "Enter your credentials to access the cloud console.";
      case "REGISTER": return "Get started with your cloud deployment journey.";
      case "OTP_VERIFY": return "We sent a 6-digit code to your email.";
      case "FORGOT_REQUEST": return "Enter your email to receive a recovery code.";
      case "FORGOT_OTP": return "Check your email for the recovery code.";
      case "FORGOT_NEW_PASS": return "Secure your account with a strong password.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor - Cloud Vibe */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 z-10 relative transition-all duration-300">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
            <Cloud size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            {getSubtitle()}
          </p>
        </div>

        {/* --- LOGIN FORM --- */}
        {view === "LOGIN" && (
          <form onSubmit={handleLogin} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@company.com"
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            {showForgotLink && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => { setView("FORGOT_REQUEST"); setError(""); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100"><ShieldCheck size={16}/> {error}</div>}

            <Button isLoading={isLoading}>Sign In</Button>

            <div className="mt-6 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setView("REGISTER"); setError(""); setShowForgotLink(false); }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Register now
                </button>
              </p>
            </div>
          </form>
        )}

        {/* --- REGISTER FORM --- */}
        {view === "REGISTER" && (
          <form onSubmit={handleRegister} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-4">
              <Input
                label="First Name"
                name="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@company.com"
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              icon={<Lock size={18} />}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Verify Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              icon={<Lock size={18} />}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={error}
              required
            />

            <Button isLoading={isLoading}>
              Create Account <ArrowRight size={16} />
            </Button>

            <div className="mt-6 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setView("LOGIN"); setError(""); }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}

        {/* --- OTP VERIFICATION (REGISTRATION) --- */}
        {view === "OTP_VERIFY" && (
          <form onSubmit={handleRegisterOtpVerify} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6">
               <Input 
                 label="Registration OTP"
                 name="otp"
                 placeholder="123456"
                 maxLength={6}
                 className="text-center text-2xl tracking-[0.5em] font-bold text-slate-700"
                 value={formData.otp}
                 onChange={handleChange}
                 required
               />
             </div>
             {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}
             <Button isLoading={isLoading}>Verify Email</Button>
             <button
                type="button"
                onClick={() => setView("REGISTER")}
                className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
             >
                Back to Register
             </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD STEP 1: REQUEST --- */}
        {view === "FORGOT_REQUEST" && (
          <form onSubmit={handleForgotRequest} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Input
              label="Enter your email"
              type="email"
              name="email"
              placeholder="you@company.com"
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={handleChange}
              required
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <Button isLoading={isLoading}>Send Recovery Code</Button>
            <button
                type="button"
                onClick={() => setView("LOGIN")}
                className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
             >
                Back to Login
             </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD STEP 2: VERIFY OTP --- */}
        {view === "FORGOT_OTP" && (
          <form onSubmit={handleForgotOtpVerify} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-2 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                <Mail size={20} />
              </div>
              <p className="text-sm text-slate-500 mb-6">Code sent to <span className="font-medium text-slate-700">{formData.email}</span></p>
            </div>

            <Input 
                 label="Recovery Code"
                 name="otp"
                 placeholder="123456"
                 maxLength={6}
                 className="text-center text-2xl tracking-[0.5em] font-bold text-slate-700"
                 value={formData.otp}
                 onChange={handleChange}
                 required
            />
            {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}
            <Button isLoading={isLoading}>Verify Code</Button>
            
            <button
                type="button"
                onClick={() => setView("FORGOT_REQUEST")}
                className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
             >
                Change Email
             </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD STEP 3: NEW PASSWORD --- */}
        {view === "FORGOT_NEW_PASS" && (
          <form onSubmit={handlePassReset} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mb-2">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm text-green-700">Code Verified</p>
            </div>

            <Input
              label="New Password"
              type="password"
              name="password"
              placeholder="New strong password"
              icon={<Lock size={18} />}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Verify New Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              icon={<Lock size={18} />}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}
            <Button isLoading={isLoading}>Reset Password</Button>
          </form>
        )}

      </div>
    </div>
  );
}