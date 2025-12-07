package com.cloud.core.controller;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.entity.ProjectEnvConfig;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.service.DeploymentService;
import com.cloud.core.service.GithubService;
import com.cloud.core.util.EncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.repository.ProjectEnvConfigRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final DeploymentService deploymentService;
    private final GithubService githubService;
    private final DeploymentRepository deploymentRepository;
    private final EncryptionUtil encryptionUtil;
    private final ProjectEnvConfigRepository envConfigRepository;


    public ProjectController(ProjectRepository projectRepository, DeploymentService deploymentService, GithubService githubService, DeploymentRepository deploymentRepository, EncryptionUtil encryptionUtil, ProjectEnvConfigRepository envConfigRepository) {
        this.projectRepository = projectRepository;
        this.deploymentService = deploymentService;
        this.githubService = githubService;
        this.deploymentRepository = deploymentRepository;
        this.encryptionUtil = encryptionUtil;
        this.envConfigRepository = envConfigRepository;
    }

    // --- 🔒 SECURITY HELPER (The Reuse Logic) ---
    private Project getAuthorizedProject(Long projectId) {
        // 1. Get Current User ID
        String userIdStr = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = Long.parseLong(userIdStr);

        // 2. Fetch Project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        // 3. Check Ownership
        if (!project.getUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this project.");
        }

        return project;
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

        if (project.getGitToken() != null && !project.getGitToken().isEmpty()) {
            try {
                String encryptedToken = encryptionUtil.encrypt(project.getGitToken());
                project.setGitToken(encryptedToken);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Failed to encrypt token");
            }
        }

        // 3. Save
        return ResponseEntity.ok(projectRepository.save(project));
    }

    // 2. Trigger a Deployment for a Project
    @PostMapping("/{projectId}/deploy")
    public Deployment deployProject(@PathVariable Long projectId, @RequestParam(defaultValue = "PROD") AppEnvironment env, @RequestBody(required = false) Map<String, String> payload) {
        // If user sends specific commit, use it. Otherwise null (Orchestrator will pick latest).
        Project project = getAuthorizedProject(projectId);
        String commitSha = (payload != null) ? payload.get("commitSha") : null;
        return deploymentService.triggerDeployment(project.getId(), commitSha, env);
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
        Project project = getAuthorizedProject(projectId);
        return githubService.getCommits(project.getRepoUrl(), project.getBranch(), project.getGitToken());
    }

    @GetMapping("/{projectId}/deployments")
    public List<Deployment> getProjectDeployments(@PathVariable Long projectId) {
        Project project = getAuthorizedProject(projectId);
        return deploymentRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProject(@PathVariable Long projectId) {
        Project project = getAuthorizedProject(projectId);
        return ResponseEntity.ok(project);
    }

    @PostMapping("/{projectId}/envs")
    public ResponseEntity<?> updateEnvs(@PathVariable Long projectId, @RequestParam AppEnvironment env, @RequestBody Map<String, String> envs) {
        Project project = getAuthorizedProject(projectId);

        System.out.println("Updating envs for project " + projectId + ": " + envs);
        
        // 1. Convert Map to JSON String
        try {
            String jsonString = new ObjectMapper().writeValueAsString(envs);
            
            // 2. Encrypt
            String encrypted = encryptionUtil.encrypt(jsonString);

            ProjectEnvConfig config = envConfigRepository.findByProjectIdAndEnvironment(projectId, env)
                    .orElse(new ProjectEnvConfig());

            config.setProject(project);
            config.setEnvironment(env);
            config.setEncryptedEnvs(encrypted);
            
            // 3. Save
            envConfigRepository.save(config);
            
            return ResponseEntity.ok("Environment variables updated");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to save envs");
        }
    }

    @GetMapping("/{projectId}/envs")
    public ResponseEntity<?> getEnvs(@PathVariable Long projectId, @RequestParam AppEnvironment env) {
        getAuthorizedProject(projectId); // Security Check

        ProjectEnvConfig config = envConfigRepository.findByProjectIdAndEnvironment(projectId, env)
                .orElse(null);

        if (config == null || config.getEncryptedEnvs() == null) {
            return ResponseEntity.ok(Collections.emptyMap());
        }
        try {
            String decrypted = encryptionUtil.decrypt(config.getEncryptedEnvs());
            Map<String, String> envMap = new ObjectMapper().readValue(decrypted, new TypeReference<Map<String, String>>() {});
            return ResponseEntity.ok(envMap);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to decrypt envs");
        }
    }
}