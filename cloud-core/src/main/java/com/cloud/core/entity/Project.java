package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String repoUrl;
    private String branch = "main";

    @Column(unique = true)   // Ensure DB enforces uniqueness too
    private String subdomain;
    
    // New fields for Monorepo/Microservices support
    private String buildPath = "."; // Default to root
    private int port = 8080;        // Default port
    private Long userId;

    @Column(columnDefinition = "TEXT") // Allow large strings
    private String envs; // Stores ENCRYPTED JSON string
    
    public String getEnvs() {
        return envs;
    }

    public void setEnvs(String envs) {
        this.envs = envs;
    }
}