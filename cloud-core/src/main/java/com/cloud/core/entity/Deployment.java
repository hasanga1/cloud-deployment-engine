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
    @JoinColumn(name = "project_id")
    private Project project;

    @Enumerated(EnumType.STRING)
    private DeploymentStatus status;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum DeploymentStatus {
        QUEUED, IN_PROGRESS, SUCCESS, FAILED
    }
}