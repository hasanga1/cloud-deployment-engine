package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g., "WSO2 Inc"

    @Column(unique = true, nullable = false)
    private String slug; // e.g., "wso2" (Used for URLs)

    private Long createdByUserId; // The user who created this org

    private LocalDateTime createdAt = LocalDateTime.now();
}