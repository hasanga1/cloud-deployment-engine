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
  createdAt: string;
}

export interface IProject {
  id: number;
  name: string;
  description?: string;
  organization: IOrganization; // Backend returns full object based on Entity
  createdAt: string;
}

export interface IComponent {
  id: number;
  name: string;
  subdomain: string;
  repoUrl: string;
  branch: string;
  port: number;
  projectId: number; // or project object depending on JSON serialization
  createdAt: string;
}