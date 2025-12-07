// src/lib/api.ts

export const fakeApi = {
  login: async (data: any) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate wrong password logic
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
        if (otp === "123456") {
          resolve({ success: true });
        } else {
          reject({ message: "Invalid OTP" });
        }
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
};