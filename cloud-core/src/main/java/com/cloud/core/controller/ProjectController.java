package com.cloud.core.controller;

import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.service.DeploymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final DeploymentService deploymentService;

    public ProjectController(ProjectRepository projectRepository, DeploymentService deploymentService) {
        this.projectRepository = projectRepository;
        this.deploymentService = deploymentService;
    }

    // 1. Create a Project
    @PostMapping
    public Project createProject(@RequestBody Project project) {
        return projectRepository.save(project);
    }

    // 2. Trigger a Deployment for a Project
    @PostMapping("/{projectId}/deploy")
    public Deployment deployProject(@PathVariable Long projectId) {
        return deploymentService.triggerDeployment(projectId);
    }
}