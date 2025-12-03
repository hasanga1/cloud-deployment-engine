package com.cloud.core.controller;

import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.service.DeploymentService;
import com.cloud.core.service.GithubService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final DeploymentService deploymentService;
    private final GithubService githubService;

    public ProjectController(ProjectRepository projectRepository, DeploymentService deploymentService, GithubService githubService) {
        this.projectRepository = projectRepository;
        this.deploymentService = deploymentService;
        this.githubService = githubService;
    }

    // 1. Create a Project
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        String userIdStr = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = Long.parseLong(userIdStr);

        project.setUserId(userId);

        // 1. Validate Subdomain (Simple Regex: only letters, numbers, hyphens)
        if (!project.getSubdomain().matches("^[a-z0-9-]+$")) {
            return ResponseEntity.badRequest().body("Subdomain must be lowercase, numbers, or hyphens.");
        }

        // 2. Check Uniqueness
        if (projectRepository.existsBySubdomain(project.getSubdomain())) {
            return ResponseEntity.badRequest().body("Subdomain '" + project.getSubdomain() + "' is already taken!");
        }

        // 3. Save
        return ResponseEntity.ok(projectRepository.save(project));
    }

    // 2. Trigger a Deployment for a Project
    @PostMapping("/{projectId}/deploy")
    public Deployment deployProject(@PathVariable Long projectId, @RequestBody(required = false) Map<String, String> payload) {
        // If user sends specific commit, use it. Otherwise null (Orchestrator will pick latest).
        String commitSha = (payload != null) ? payload.get("commitSha") : null;
        return deploymentService.triggerDeployment(projectId, commitSha);
    }

    @GetMapping
    public List<Project> getMyProjects() {
        // Extract User ID from Token (Security Context)
        String userIdStr = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = Long.parseLong(userIdStr);
        
        return projectRepository.findAllByUserId(userId);
    }

    @GetMapping("/{projectId}/commits")
    public List<Map<String, String>> getProjectCommits(@PathVariable Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        return githubService.getCommits(project.getRepoUrl(), project.getBranch());
    }
}