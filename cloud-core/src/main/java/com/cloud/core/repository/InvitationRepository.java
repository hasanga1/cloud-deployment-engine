package com.cloud.core.repository;

import com.cloud.core.entity.OrganizationInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<OrganizationInvitation, String> {
    Optional<OrganizationInvitation> findByToken(String token);
}