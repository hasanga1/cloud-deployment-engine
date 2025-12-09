package com.cloud.core.controller;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.Component;
import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.entity.ComponentEnvConfig;
import com.cloud.core.repository.ComponentRepository;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.service.DeploymentService;
import com.cloud.core.service.GithubService;
import com.cloud.core.service.AuthHelper;
import com.cloud.core.util.EncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.repository.ComponentEnvConfigRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/components")
public class ComponentController {

    private final ComponentRepository componentRepository;
    private final DeploymentService deploymentService;
    private final GithubService githubService;
    private final DeploymentRepository deploymentRepository;
    private final EncryptionUtil encryptionUtil;
    private final ComponentEnvConfigRepository envConfigRepository;
    private final ProjectRepository projectRepository;
    private final AuthHelper authHelper;


    public ComponentController(ComponentRepository componentRepository, DeploymentService deploymentService, GithubService githubService, DeploymentRepository deploymentRepository, EncryptionUtil encryptionUtil, ComponentEnvConfigRepository envConfigRepository, ProjectRepository projectRepository, AuthHelper authHelper) {
        this.componentRepository = componentRepository;
        this.deploymentService = deploymentService;
        this.githubService = githubService;
        this.deploymentRepository = deploymentRepository;
        this.encryptionUtil = encryptionUtil;
        this.envConfigRepository = envConfigRepository;
        this.projectRepository = projectRepository;
        this.authHelper = authHelper;
    }

    private Component getAuthorizedComponent(Long componentId) {
        Component component = componentRepository.findById(componentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Component not found"));
        authHelper.checkAccess(component.getProject().getOrganization().getId());
        return component;
    }

    // 1. Create a Project
    @PostMapping("/project/{projectId}")
    public ResponseEntity<?> createComponent(@PathVariable Long projectId, @RequestBody Component component) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        authHelper.checkAccess(project.getOrganization().getId());

        component.setProject(project);

        // 1. Validate Subdomain (Simple Regex: only letters, numbers, hyphens)
        if (!component.getSubdomain().matches("^[a-z0-9-]+$")) {
            return ResponseEntity.badRequest().body("Subdomain must be lowercase, numbers, or hyphens.");
        }

        // 2. Check Uniqueness
        if (componentRepository.existsBySubdomain(component.getSubdomain())) {
            return ResponseEntity.badRequest().body("Subdomain '" + component.getSubdomain() + "' is already taken!");
        }

        if (component.getGitToken() != null && !component.getGitToken().isEmpty()) {
            try {
                String encryptedToken = encryptionUtil.encrypt(component.getGitToken());
                component.setGitToken(encryptedToken);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Failed to encrypt token");
            }
        }

        // 3. Save
        return ResponseEntity.ok(componentRepository.save(component));
    }

    // 2. Trigger a Deployment for a Project
    @PostMapping("/{componentId}/deploy")
    public Deployment deployProject(@PathVariable Long componentId, @RequestParam(defaultValue = "PROD") AppEnvironment env, @RequestBody(required = false) Map<String, String> payload) {
        Component component = getAuthorizedComponent(componentId);

        String commitSha = (payload != null) ? payload.get("commitSha") : null;
        return deploymentService.triggerDeployment(component, commitSha, env);
    }

    @GetMapping("/project/{projectId}")
    public List<Component> getComponentsByProject(@PathVariable Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        authHelper.checkAccess(project.getOrganization().getId());
        return componentRepository.findAllByProjectId(projectId);
    }

    @GetMapping("/{componentId}/commits")
    public List<Map<String, String>> getProjectCommits(@PathVariable Long componentId) {
        Component component = getAuthorizedComponent(componentId);
        
        return githubService.getCommits(component.getRepoUrl(), component.getBranch(), component.getGitToken());
    }

    @GetMapping("/{componentId}/deployments")
    public List<Deployment> getProjectDeployments(@PathVariable Long componentId) {
        Component component = getAuthorizedComponent(componentId);
        return deploymentRepository.findAllByComponentIdOrderByCreatedAtDesc(component.getId());
    }

    @GetMapping("/{componentId}")
    public ResponseEntity<?> getProject(@PathVariable Long componentId) {
        Component component = getAuthorizedComponent(componentId);
        return ResponseEntity.ok(component.getProject());
    }

    @PostMapping("/{componentId}/envs")
    public ResponseEntity<?> updateEnvs(@PathVariable Long componentId, @RequestParam AppEnvironment env, @RequestBody Map<String, String> envs) {
        Component component = getAuthorizedComponent(componentId);

        System.out.println("Updating envs for component " + componentId + ": " + envs);
        
        // 1. Convert Map to JSON String
        try {
            String jsonString = new ObjectMapper().writeValueAsString(envs);
            
            // 2. Encrypt
            String encrypted = encryptionUtil.encrypt(jsonString);

            ComponentEnvConfig config = envConfigRepository.findByComponentIdAndEnvironment(component.getId(), env)
                    .orElse(new ComponentEnvConfig());

            config.setComponent(component);
            config.setEnvironment(env);
            config.setEncryptedEnvs(encrypted);
            
            // 3. Save
            envConfigRepository.save(config);
            
            return ResponseEntity.ok("Environment variables updated");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to save envs");
        }
    }

    @GetMapping("/{componentId}/envs")
    public ResponseEntity<?> getEnvs(@PathVariable Long componentId, @RequestParam AppEnvironment env) {
        getAuthorizedComponent(componentId); // Security Check

        ComponentEnvConfig config = envConfigRepository.findByComponentIdAndEnvironment(componentId, env)
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

    @GetMapping("/{componentId}/status")
    public ResponseEntity<?> getComponentStatus(@PathVariable Long componentId) {
        // 1. Fetch Component
        Component component = componentRepository.findById(componentId)
                .orElseThrow(() -> new RuntimeException("Component not found"));

        // 2. Security Check (Traverse up to Organization)
        // Check if current user is a member of the Org that owns this component
        authHelper.checkAccess(component.getProject().getOrganization().getId());

        // 3. Get Status
        Map<String, Boolean> status = deploymentService.getComponentRunStatus(componentId);
        
        return ResponseEntity.ok(status);
    }
}