package com.cloud.core.controller;

import com.cloud.core.entity.MemberRole;
import com.cloud.core.entity.Organization;
import com.cloud.core.entity.OrganizationMember;
import com.cloud.core.repository.OrganizationMemberRepository;
import com.cloud.core.repository.OrganizationRepository;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.service.AuthHelper;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orgs")
public class OrganizationController {

    private final OrganizationRepository orgRepo;
    private final OrganizationMemberRepository memberRepo;
    private final AuthHelper authHelper;
    private final ProjectRepository projectRepository;
    private final DeploymentRepository deploymentRepository;

    public OrganizationController(OrganizationRepository orgRepo, OrganizationMemberRepository memberRepo, AuthHelper authHelper, ProjectRepository projectRepository, DeploymentRepository deploymentRepository) {
        this.orgRepo = orgRepo;
        this.memberRepo = memberRepo;
        this.authHelper = authHelper;
        this.projectRepository = projectRepository;
        this.deploymentRepository = deploymentRepository;
    }

    @PostMapping
    public Organization createOrg(@RequestBody Organization org) {
        Long userId = authHelper.getCurrentUserId();

        if (orgRepo.existsBySlug(org.getSlug())) {
            throw new RuntimeException("Slug already taken");
        }

        org.setCreatedByUserId(userId);
        Organization savedOrg = orgRepo.save(org);

        // Add creator as OWNER
        OrganizationMember member = new OrganizationMember();
        member.setOrganization(savedOrg);
        member.setUserId(userId);
        member.setRole(MemberRole.OWNER);
        memberRepo.save(member);

        return savedOrg;
    }

    @GetMapping
    public List<Organization> getMyOrgs() {
        Long userId = authHelper.getCurrentUserId();
        // Join query to find orgs where user is a member
        return memberRepo.findAllByUserId(userId).stream()
                .map(OrganizationMember::getOrganization)
                .toList();
    }

    @GetMapping("/{orgId}/stats/projects")
    public ResponseEntity<Long> getProjectCount(@PathVariable Long orgId) {
        // Security Check
        authHelper.checkAccess(orgId);

        long count = projectRepository.countByOrganizationId(orgId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/{orgId}/stats/deployments")
    public ResponseEntity<Long> getDeploymentCount(@PathVariable Long orgId) {
        // Security Check
        authHelper.checkAccess(orgId);

        long count = deploymentRepository.countByOrganizationId(orgId);
        return ResponseEntity.ok(count);
    }
}