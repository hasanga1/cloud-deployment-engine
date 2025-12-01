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
    
    // New fields for Monorepo/Microservices support
    private String buildPath = "."; // Default to root
    private int port = 8080;        // Default port
}