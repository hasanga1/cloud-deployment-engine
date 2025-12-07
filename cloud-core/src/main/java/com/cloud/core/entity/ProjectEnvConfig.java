package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "environment"}) // One config per env per project
})
public class ProjectEnvConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppEnvironment environment;

    @Column(columnDefinition = "TEXT")
    private String encryptedEnvs; // JSON string of variables specific to this env
}