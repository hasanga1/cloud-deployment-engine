package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"component_id", "environment"}) // One config per env per project
})
public class ComponentEnvConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "component_id", nullable = false)
    private Component component;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppEnvironment environment;

    @Column(columnDefinition = "TEXT")
    private String encryptedEnvs; // JSON string of variables specific to this env
}