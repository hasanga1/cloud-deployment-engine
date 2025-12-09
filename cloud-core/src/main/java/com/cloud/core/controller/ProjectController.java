package com.cloud.core.controller;

import com.cloud.core.entity.Organization;
import com.cloud.core.entity.Project;
import com.cloud.core.repository.OrganizationRepository;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.service.AuthHelper;
import com.cloud.core.service.DeploymentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepo;
    private final OrganizationRepository orgRepo;
    private final AuthHelper authHelper;
    private final DeploymentService deploymentService;

    public ProjectController(ProjectRepository projectRepo, OrganizationRepository orgRepo, AuthHelper authHelper, DeploymentService deploymentService) {
        this.projectRepo = projectRepo;
        this.orgRepo = orgRepo;
        this.authHelper = authHelper;
        this.deploymentService = deploymentService;
    }

    // Create Project inside an Org
    @PostMapping("/org/{orgId}")
    public Project createProject(@PathVariable Long orgId, @RequestBody Project project) {
        authHelper.checkAccess(orgId); // Security Check

        Organization org = orgRepo.findById(orgId).orElseThrow();
        project.setOrganization(org);
        
        return projectRepo.save(project);
    }

    // List Projects for an Org
    @GetMapping("/org/{orgId}")
    public List<Project> getProjects(@PathVariable Long orgId) {
        authHelper.checkAccess(orgId);
        return projectRepo.findAllByOrganizationId(orgId);
    }
    
    // Get single project
    @GetMapping("/{id}")
    public Project getProject(@PathVariable Long id) {
        Project p = projectRepo.findById(id).orElseThrow();
        authHelper.checkAccess(p.getOrganization().getId());
        return p;
    }

    @GetMapping("/{projectId}/health")
    public ResponseEntity<?> getProjectHealth(@PathVariable Long projectId) {
        // 1. Security Check (Reuse your helper)
        Project p = projectRepo.findById(projectId).orElseThrow();
        authHelper.checkAccess(p.getOrganization().getId());

        // 2. Calculate
        Map<String, Double> health = deploymentService.getProjectHealth(projectId);
        
        return ResponseEntity.ok(health);
    }
}