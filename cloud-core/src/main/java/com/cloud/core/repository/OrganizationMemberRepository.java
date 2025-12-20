package com.cloud.core.repository;
import com.cloud.core.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, Long> {
    List<OrganizationMember> findAllByUserId(Long userId);
    Optional<OrganizationMember> findByUserIdAndOrganizationId(Long userId, Long organizationId);
    List<OrganizationMember> findAllByOrganizationId(Long organizationId);
}
