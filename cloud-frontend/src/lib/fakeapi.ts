// src/lib/fakeapi.ts

// --- Mock Data Constants ---
const MOCK_USER = {
  name: "John Doe",
  email: "john@clouddeploy.com",
  avatar: "JD",
  orgName: "SkyHigh Tech",
  plan: "Pro Plan",
};

const MOCK_STATS = [
  {
    label: "Total Projects",
    value: "12",
    change: "+2 this month",
    trend: "up",
  },
  {
    label: "Active Deployments",
    value: "28",
    change: "99.9% uptime",
    trend: "up",
  },
  {
    label: "Total Requests",
    value: "1.2M",
    change: "+15% vs last week",
    trend: "up",
  },
];

const MOCK_PROJECTS = [
  {
    id: 1,
    name: "e-commerce-backend",
    framework: "Node.js",
    repo: "github.com/acme/backend",
    lastDeploy: "2m ago",
    status: "healthy",
    envs: { dev: "success", stage: "success", prod: "success" },
  },
  {
    id: 2,
    name: "customer-dashboard",
    framework: "Next.js",
    repo: "github.com/acme/dashboard",
    lastDeploy: "1h ago",
    status: "warning",
    envs: { dev: "success", stage: "failed", prod: "success" },
  },
  {
    id: 3,
    name: "auth-service",
    framework: "Go",
    repo: "github.com/acme/auth",
    lastDeploy: "5d ago",
    status: "healthy",
    envs: { dev: "success", stage: "success", prod: "success" },
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    user: "John Doe",
    action: "deployed",
    project: "auth-service",
    target: "Production",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "failed to deploy",
    project: "payment-gateway",
    target: "Staging",
    time: "5 hours ago",
    status: "failed",
  },
  {
    id: 3,
    user: "John Doe",
    action: "created project",
    project: "analytics-worker",
    target: "",
    time: "1 day ago",
    status: "success",
  },
  {
    id: 4,
    user: "System",
    action: "auto-scaled",
    project: "e-commerce-backend",
    target: "Production",
    time: "2 days ago",
    status: "success",
  },
];

// --- The API ---

export const fakeApi = {
  // ... (Your existing Auth methods: login, register, verifyOtp, etc. keep them here) ...
  login: async (data: any) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data.password === "wrong") {
          reject({ message: "Invalid credentials" });
        } else {
          resolve({ success: true, token: "fake-jwt-token" });
        }
      }, 1500);
    });
  },
  register: async (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "OTP sent to email" });
      }, 1500);
    });
  },
  verifyOtp: async (otp: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === "123456") resolve({ success: true });
        else reject({ message: "Invalid OTP" });
      }, 1000);
    });
  },
  requestPasswordReset: async (email: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "Reset OTP sent" });
      }, 1000);
    });
  },
  resetPassword: async (data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1500);
    });
  },

  // --- NEW DASHBOARD ENDPOINTS ---

  getUserProfile: async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_USER), 800); // Simulate faster fetch
    });
  },

  getDashboardStats: async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_STATS), 1000);
    });
  },

  getRecentProjects: async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_PROJECTS), 1200);
    });
  },

  getRecentActivity: async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_ACTIVITY), 1500);
    });
  },
};
