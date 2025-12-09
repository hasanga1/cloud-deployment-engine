package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"organization_id", "user_id"}) // User can join org only once
})
public class OrganizationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private Long userId; // From Auth Service

    @Enumerated(EnumType.STRING)
    private MemberRole role;
}