 package com.cloud.core.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class OrganizationInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String token; // The unique link ID

    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String email; // The specific person invited

    @Enumerated(EnumType.STRING)
    private MemberRole role = MemberRole.DEVELOPER; // Default role

    private LocalDateTime expiryDate; // e.g., 48 hours
}