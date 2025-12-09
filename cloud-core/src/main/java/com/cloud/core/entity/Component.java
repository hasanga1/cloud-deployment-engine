package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Component {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project; // Parent Project

    private String name; // e.g., "Frontend"
    
    // Subdomain for this specific service (e.g., "web")
    // Full URL will be: org-project-component.localhost
    private String subdomain; 

    // --- Git Config ---
    private String repoUrl;
    private String branch = "main";
    private String buildPath = ".";
    @Column(columnDefinition = "TEXT")
    private String gitToken; // Encrypted

    // --- Docker Config ---
    private int port = 8080;
    
    // --- Env Config ---
    @Column(columnDefinition = "TEXT")
    private String encryptedEnvs; // Default/Global variables

    private LocalDateTime createdAt = LocalDateTime.now();
}