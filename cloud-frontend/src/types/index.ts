// --- Enums ---

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

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  DEVELOPER = "DEVELOPER",
  VIEWER = "VIEWER",
}

// --- Interfaces ---

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

export interface IOrganizationMember {
  id: number;
  organization: IOrganization;
  userId: number;
  role: MemberRole;
}

export interface IProject {
  id: number;
  name: string;
  description?: string;
  organization: IOrganization; // Nested object from @ManyToOne
  createdAt: string;
}

export interface IComponent {
  id: number;
  name: string;
  subdomain: string;
  
  // Git Config
  repoUrl: string;
  branch: string;
  buildPath: string;
  
  // Docker Config
  port: number;
  
  // Relationships
  project: IProject; // Nested object from @ManyToOne
  
  createdAt: string;
}

export interface IComponentEnvConfig {
  id: number;
  component: IComponent;
  environment: AppEnvironment;
  encryptedEnvs: string; 
}

export interface IDeployment {
  id: string; // UUID is a string in TS
  
  // Relationships
  component?: IComponent; // Optional, depending on if backend expands it in the list view
  
  // Git Details
  commitSha: string;
  commitMessage: string;
  
  // State
  status: DeploymentStatus;
  environment: AppEnvironment;
  
  createdAt: string;
}