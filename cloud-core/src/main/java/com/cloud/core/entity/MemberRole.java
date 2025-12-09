package com.cloud.core.entity;

public enum MemberRole {
    OWNER,      // Can delete org, manage billing
    ADMIN,      // Can add/remove members, create projects
    DEVELOPER,  // Can deploy components
    VIEWER      // Read-only
}