package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id; // UUIDs are better for deployment IDs

    @ManyToOne
    @JoinColumn(name = "component_id")
    private Component component;

    private String commitSha;
    private String commitMessage;

    @Enumerated(EnumType.STRING)
    private DeploymentStatus status;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private AppEnvironment environment;

    public enum DeploymentStatus {
        QUEUED,
        IN_PROGRESS,
        RUNNING,
        STOPPED,
        FAILED
    }
}