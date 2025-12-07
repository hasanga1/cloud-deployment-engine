"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Cloud,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fakeApi } from "@/lib/fakeapi";
import api from "@/lib/api";

type AuthView =
  | "LOGIN"
  | "REGISTER"
  | "OTP_VERIFY"
  | "FORGOT_REQUEST"
  | "FORGOT_OTP"
  | "FORGOT_NEW_PASS";

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Error Message AND Error Target (which field is wrong)
  const [error, setError] = useState("");
  const [errorTarget, setErrorTarget] = useState<"email" | "password" | "confirmPassword" | "otp" | "general" | "">("");
  
  const [showForgotLink, setShowForgotLink] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  // --- Password Strength Logic ---
  const [passwordCriteria, setPasswordCriteria] = useState([
    { label: "At least 8 characters", valid: false, regex: /.{8,}/ },
    { label: "Uppercase letter", valid: false, regex: /[A-Z]/ },
    { label: "Number", valid: false, regex: /[0-9]/ },
    { label: "Special symbol (!@#$)", valid: false, regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ]);

  useEffect(() => {
    const newCriteria = passwordCriteria.map((c) => ({
      ...c,
      valid: c.regex.test(formData.password),
    }));
    setPasswordCriteria(newCriteria);
  }, [formData.password]);

  const isPasswordValid = passwordCriteria.every((c) => c.valid);

  // --- Input Handler ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user types to improve UX
    if (error) {
      setError("");
      setErrorTarget("");
    }
  };

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        setError("Invalid credentials");
        setErrorTarget("general"); // Login errors are usually general security/privacy
      } else {
        setError(err?.message || "Login failed");
        setErrorTarget("general");
      }
      if (formData.password !== "") setShowForgotLink(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation Checks
    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      setErrorTarget("password"); // Target the Password field
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setErrorTarget("confirmPassword"); // Target the Confirm field
      return;
    }

    setIsLoading(true);
    try {
      // 2. Check if email already exists
      const emailCheckRes = await api.post("/auth/check-email", {
        email: formData.email,
      });
      
      if (emailCheckRes.data.exists) {
        setError("Email is already registered");
        setErrorTarget("email"); // Target the Email field specifically
        setIsLoading(false);
        return;
      }

      // 3. Send the OTP code HERE
      await api.post("/auth/send-code", {
        email: formData.email
      });

      // 4. Proceed if email is unique and code sent
      setView("OTP_VERIFY");
      setError("");
      setErrorTarget("");
    } catch (err: any) {
      setError(err.message);
      setErrorTarget("general");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // If OTP is correct, register the user
      await api.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        code: formData.otp,
      });
      setError("");
      setErrorTarget("");
      setShowForgotLink(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        otp: "",
      });
      setView("LOGIN");
    } catch (err: any) {
      setError("Invalid OTP. Try 123456");
      setErrorTarget("otp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fakeApi.requestPasswordReset(formData.email);
      setView("FORGOT_OTP");
      setError("");
      setErrorTarget("");
      setFormData((prev) => ({ ...prev, otp: "" }));
    } catch (err: any) {
      setError(err.message);
      setErrorTarget("email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fakeApi.verifyOtp(formData.otp);
      setView("FORGOT_NEW_PASS");
      setError("");
      setErrorTarget("");
    } catch (err: any) {
      setError("Invalid OTP. Try 123456");
      setErrorTarget("otp");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      setErrorTarget("password");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setErrorTarget("confirmPassword");
      return;
    }

    setIsLoading(true);
    try {
      await fakeApi.resetPassword(formData);
      alert("Password reset successfully. Please login.");
      setView("LOGIN");
      setError("");
      setErrorTarget("");
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
        otp: "",
      }));
    } catch (err: any) {
      setError(err.message);
      setErrorTarget("general");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Helpers ---

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

  const PasswordRequirements = () => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {passwordCriteria.map((item, index) => (
        <div 
          key={index} 
          className={`text-xs flex items-center gap-1.5 transition-colors duration-200 ${
            item.valid ? "text-green-600 font-medium" : "text-slate-400"
          }`}
        >
          {item.valid ? <Check size={12} strokeWidth={3} /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
          {item.label}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 z-10 relative transition-all duration-300">
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
              error={errorTarget === "email" ? error : ""}
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
              // For login, we usually show error on password or a general banner
              error={errorTarget === "password" ? error : ""}
              required
            />

            {showForgotLink && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => { setView("FORGOT_REQUEST"); setError(""); setErrorTarget(""); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* General Error Banner (Only for login or system errors) */}
            {errorTarget === "general" && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                <ShieldCheck size={16} /> {error}
              </div>
            )}

            <Button isLoading={isLoading}>Sign In</Button>

            <div className="mt-6 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("REGISTER");
                    setError("");
                    setErrorTarget("");
                    setShowForgotLink(false);
                    setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", otp: "" });
                  }}
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
              // FIXED: Error now shows here if Email is registered
              error={errorTarget === "email" ? error : ""}
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
              // FIXED: Error shows here if strength is low
              error={errorTarget === "password" ? error : ""}
              required
            />
            
            <PasswordRequirements />

            <Input
              label="Verify Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              icon={<Lock size={18} />}
              value={formData.confirmPassword}
              onChange={handleChange}
              // FIXED: Error shows here ONLY for mismatch
              error={errorTarget === "confirmPassword" ? error : ""}
              required
            />

            {errorTarget === "general" && (
              <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
            )}

            <Button isLoading={isLoading}>
              Create Account <ArrowRight size={16} />
            </Button>

            <div className="mt-6 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("LOGIN");
                    setError("");
                    setErrorTarget("");
                    setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", otp: "" });
                  }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}

        {/* --- OTP VERIFY --- */}
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
                error={errorTarget === "otp" ? error : ""}
                required
              />
            </div>
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

        {/* --- FORGOT PASSWORD REQUEST --- */}
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
              error={errorTarget === "email" ? error : ""}
              required
            />
            {errorTarget === "general" && <p className="text-red-500 text-sm mb-4">{error}</p>}
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

        {/* --- FORGOT OTP --- */}
        {view === "FORGOT_OTP" && (
          <form onSubmit={handleForgotOtpVerify} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-2 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                <Mail size={20} />
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Code sent to <span className="font-medium text-slate-700">{formData.email}</span>
              </p>
            </div>
            <Input
              label="Recovery Code"
              name="otp"
              placeholder="123456"
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-bold text-slate-700"
              value={formData.otp}
              onChange={handleChange}
              error={errorTarget === "otp" ? error : ""}
              required
            />
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

        {/* --- FORGOT NEW PASS --- */}
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
              error={errorTarget === "password" ? error : ""}
              required
            />

            {/* Password Strength Indicator */}
            <PasswordRequirements />

            <Input
              label="Verify New Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              icon={<Lock size={18} />}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errorTarget === "confirmPassword" ? error : ""}
              required
            />
            {errorTarget === "general" && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}
            <Button isLoading={isLoading}>Reset Password</Button>
          </form>
        )}
      </div>
    </div>
  );
}