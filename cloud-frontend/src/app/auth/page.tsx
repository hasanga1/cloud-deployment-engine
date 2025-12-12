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
  Timer,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
// --- IMPORTS FOR REUSABLE LOGIC ---
import { usePasswordValidation } from "@/app/hooks/usePasswordValidation";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

const OTP_DURATION = Number(process.env.NEXT_PUBLIC_OTP_DURATION) || 60;

type AuthView =
  | "LOGIN"
  | "REGISTER"
  | "OTP_VERIFY"
  | "FORGOT_REQUEST"
  | "FORGOT_SENT";

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorTarget, setErrorTarget] = useState<
    "email" | "password" | "confirmPassword" | "otp" | "general" | ""
  >("");
  const [showForgotLink, setShowForgotLink] = useState(false);

  // Timer State
  const [timer, setTimer] = useState(OTP_DURATION);
  const [canResend, setCanResend] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  // --- REPLACED DUPLICATE LOGIC WITH HOOK ---
  const { criteria, isValid: isPasswordValid } = usePasswordValidation(
    formData.password
  );

  // --- Timer Logic (Unchanged) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === "OTP_VERIFY") {
      if (timer > 0) {
        interval = setInterval(() => {
          setTimer((prev) => prev - 1);
        }, 1000);
      } else {
        setCanResend(true);
      }
    }
    return () => clearInterval(interval);
  }, [timer, view]);

  useEffect(() => {
    if (view === "OTP_VERIFY") {
      setTimer(OTP_DURATION);
      setCanResend(false);
    }
  }, [view]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) {
      setError("");
      setErrorTarget("");
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  // --- Handlers (Unchanged logic, just using isPasswordValid from hook) ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("token", res.data.token);
      router.push("/overview");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        setError("Invalid credentials");
        setErrorTarget("general");
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
      const emailCheckRes = await api.post("/auth/check-email", {
        email: formData.email,
      });
      if (emailCheckRes.data.exists) {
        setError("Email is already registered");
        setErrorTarget("email");
        setIsLoading(false);
        return;
      }
      await api.post("/auth/send-code", { email: formData.email });
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
      setError("Invalid OTP!");
      setErrorTarget("otp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      await api.post("/auth/send-code", { email: formData.email });
      setTimer(OTP_DURATION);
      setCanResend(false);
      setError("");
      alert("Code resent successfully!");
    } catch (err: any) {
      setError("Failed to resend code");
      setErrorTarget("general");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const emailCheckRes = await api.post("/auth/check-email", {
        email: formData.email,
      });
      if (!emailCheckRes.data.exists) {
        setError("Email not found");
        setErrorTarget("email");
        setIsLoading(false);
        return;
      }
      await api.post("/auth/forgot-password", { email: formData.email });
      setView("FORGOT_SENT");
      setError("");
      setErrorTarget("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setErrorTarget("email");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Helpers ---
  const getTitle = () => {
    switch (view) {
      case "LOGIN":
        return "Welcome Back";
      case "REGISTER":
        return "Create Account";
      case "OTP_VERIFY":
        return "Verify Registration";
      case "FORGOT_REQUEST":
        return "Reset Password";
      case "FORGOT_SENT":
        return "Check Your Inbox";
      default:
        return "Authentication";
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case "LOGIN":
        return "Enter your credentials to access the cloud console.";
      case "REGISTER":
        return "Get started with your cloud deployment journey.";
      case "OTP_VERIFY":
        return "We sent a 6-digit code to your email.";
      case "FORGOT_REQUEST":
        return "Enter your email to receive a password recovery link.";
      case "FORGOT_SENT":
        return `We have sent a recovery link to ${formData.email}`;
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 z-10 relative transition-all duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
            {view === "FORGOT_SENT" ? (
              <CheckCircle2 size={24} />
            ) : (
              <Cloud size={24} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            {getSubtitle()}
          </p>
        </div>

        {view === "LOGIN" && (
          <form
            onSubmit={handleLogin}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
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
              error={errorTarget === "password" ? error : ""}
              required
            />
            {showForgotLink && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setView("FORGOT_REQUEST");
                    setError("");
                    setErrorTarget("");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}
            {errorTarget === "general" && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                <ShieldCheck size={16} /> {error}
              </div>
            )}
            <Button isLoading={isLoading}>Sign In</Button>
            <div className="mt-6 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("REGISTER");
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
                  }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Register now
                </button>
              </p>
            </div>
          </form>
        )}

        {view === "REGISTER" && (
          <form
            onSubmit={handleRegister}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
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
              error={errorTarget === "password" ? error : ""}
              required
            />

            {/* REUSABLE COMPONENT HERE */}
            <PasswordStrengthIndicator criteria={criteria} />

            <Input
              label="Verify Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              icon={<Lock size={18} />}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errorTarget === "confirmPassword" ? error : ""}
              required
            />
            {errorTarget === "general" && (
              <div className="mb-4 text-red-500 text-sm text-center">
                {error}
              </div>
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
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      otp: "",
                    });
                  }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}

        {view === "OTP_VERIFY" && (
          <form
            onSubmit={handleRegisterOtpVerify}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
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
              <div className="flex items-center justify-between text-sm mt-2 px-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Timer size={14} />
                  <span>{formatTime(timer)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend}
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    canResend
                      ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw
                    size={14}
                    className={isLoading ? "animate-spin" : ""}
                  />
                  Resend Code
                </button>
              </div>
            </div>
            {errorTarget === "general" && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
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

        {view === "FORGOT_REQUEST" && (
          <form
            onSubmit={handleForgotRequest}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
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
            {errorTarget === "general" && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <Button isLoading={isLoading}>Send Recovery Link</Button>
            <button
              type="button"
              onClick={() => setView("LOGIN")}
              className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}

        {view === "FORGOT_SENT" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 mb-6">
              <Inbox className="text-slate-400" size={48} />
            </div>
            <p className="text-slate-600 mb-8">
              Click the link sent to your email to reset your password. The link
              will expire shortly.
            </p>
            <Button
              onClick={() => {
                setView("LOGIN");
                setFormData((prev) => ({ ...prev, email: "", password: "" }));
              }}
            >
              Return to Login
            </Button>
            <button
              type="button"
              onClick={() => setView("FORGOT_REQUEST")}
              className="w-full mt-6 text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              Didn&apos;t receive it? Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
