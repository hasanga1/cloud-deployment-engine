// src/types/index.ts

export enum AppEnvironment {
  DEV = "DEV",
  STG = "STG",
  PROD = "PROD",
}

export enum DeploymentStatus {
  QUEUED = "QUEUED",
  IN_PROGRESS = "IN_PROGRESS",
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  FAILED = "FAILED",
}

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IOrganization {
  id: number;
  name: string;
  slug: string;
  createdByUserId: number;
  createdAt?: string;
}

export interface IProject {
  id: number;
  name: string;
  description?: string;
  organization: IOrganization;
  createdAt: string;
  // Optional: Frontend specific fields for UI if backend doesn't send them yet
  status?: "healthy" | "warning" | "failed"; 
}

export interface IComponent {
  id: number;
  name: string;
  subdomain: string;
  repoUrl: string;
  port: number;
  projectId: number;
}

export interface IDeployment {
  id: string;
  componentId: number;
  status: DeploymentStatus;
  environment: AppEnvironment;
  commitSha: string;
  createdAt: string;
}