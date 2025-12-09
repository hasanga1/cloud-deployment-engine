package com.cloud.core.service;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Organization;
import com.cloud.core.entity.Project;
import com.cloud.core.entity.Component;
import com.cloud.core.entity.ComponentEnvConfig;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.repository.ComponentRepository;
import com.cloud.core.util.EncryptionUtil;
import com.cloud.core.repository.ComponentEnvConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;

@Service
public class DeploymentService {

    private final DeploymentRepository deploymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final EncryptionUtil encryptionUtil;
    private final ComponentEnvConfigRepository envConfigRepository;
    private final ComponentRepository componentRepository;

    public DeploymentService(DeploymentRepository deploymentRepository,
                             KafkaTemplate<String, Object> kafkaTemplate,
                             EncryptionUtil encryptionUtil,
                             ComponentEnvConfigRepository envConfigRepository,
                             ComponentRepository componentRepository) {
        this.deploymentRepository = deploymentRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.encryptionUtil = encryptionUtil;
        this.envConfigRepository = envConfigRepository;
        this.componentRepository = componentRepository;
    }

    public Deployment triggerDeployment(Component component, String commitSha, AppEnvironment env) {
        // 1. Fetch Project
        Project project = component.getProject();
        Organization org = project.getOrganization();

        String gitToken = null;
        if (component.getGitToken() != null && !component.getGitToken().isEmpty()) {
            try {
                gitToken = encryptionUtil.decrypt(component.getGitToken());
            } catch (Exception e) {
                System.err.println("Failed to decrypt git token");
            }
        }

        Map<String, String> envVars = new HashMap<>();
        Optional<ComponentEnvConfig> config = envConfigRepository.findByComponentIdAndEnvironment(component.getId(), env);

        String fullSubdomain = String.format("%s-%s-%s", 
            org.getSlug(), 
            project.getName().toLowerCase().replaceAll(" ", "-"), // Sanitize
            component.getSubdomain()
        );

        if (env != AppEnvironment.PROD) {
            fullSubdomain += "-" + env.name().toLowerCase();
        }

        // 2. Create Deployment Record (Status: QUEUED)
        Deployment deployment = new Deployment();
        deployment.setComponent(component);
        deployment.setEnvironment(env);
        deployment.setStatus(Deployment.DeploymentStatus.QUEUED);
        deployment.setCommitSha(commitSha);
        deploymentRepository.save(deployment);

        // 3. Prepare Payload for Orchestrator
        Map<String, Object> message = new HashMap<>();
        message.put("deploymentId", deployment.getId());
        message.put("repoUrl", component.getRepoUrl());
        message.put("branch", component.getBranch());
        message.put("buildPath", component.getBuildPath());
        message.put("port", component.getPort());
        message.put("subdomain", fullSubdomain);
        message.put("commitSha", commitSha);
        message.put("env", envVars);
        message.put("gitToken", gitToken);

        // 4. Send to Kafka
        kafkaTemplate.send("deployments.trigger", message);
        System.out.println("🚀 Triggered Deployment: " + deployment.getId());

        return deployment;
    }

    public void stopDeployment(String deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new RuntimeException("Deployment not found"));

        try {
            // 1. Prepare stop command
            Map<String, String> message = new HashMap<>();
            message.put("deploymentId", deploymentId);
            message.put("action", "STOP");

            // 2. Convert to JSON string (FIX: This was missing!)
            String jsonMessage = objectMapper.writeValueAsString(message);

            // 3. Send to Kafka control topic
            kafkaTemplate.send("deployments.control", jsonMessage);

            System.out.println("📤 Sent stop command for deployment: " + deploymentId);
            System.out.println("📋 Message payload: " + jsonMessage);

        } catch (Exception e) {
            System.err.println("❌ Failed to send stop command: " + e.getMessage());
            throw new RuntimeException("Failed to send stop command for deployment: " + deploymentId, e);
        }

        // Optional: Update deployment status immediately for UI responsiveness
        // deployment.setStatus(Deployment.DeploymentStatus.STOPPING);
        // deploymentRepository.save(deployment);
    }

    public Map<String, Double> getProjectHealth(Long projectId) {
        // 1. Get all components for this project
        List<Component> components = componentRepository.findAllByProjectId(projectId);
        
        Map<String, Double> healthMap = new HashMap<>();
        
        // Handle edge case: Project has no components yet
        if (components.isEmpty()) {
            healthMap.put("DEV", 0.0);
            healthMap.put("STG", 0.0);
            healthMap.put("PROD", 0.0);
            return healthMap;
        }

        // 2. Iterate through each Environment (DEV, STG, PROD)
        for (AppEnvironment env : AppEnvironment.values()) {
            int runningCount = 0;

            // 3. Check each component
            for (Component component : components) {
                // Find the LATEST deployment for this component in this env
                Optional<Deployment> latestDeployment = deploymentRepository
                        .findTopByComponentIdAndEnvironmentOrderByCreatedAtDesc(component.getId(), env);

                // Check if it exists AND is running
                if (latestDeployment.isPresent() && 
                    latestDeployment.get().getStatus() == Deployment.DeploymentStatus.RUNNING) {
                    runningCount++;
                }
            }

            // 4. Calculate Percentage (Running / Total)
            double percentage = (double) runningCount / components.size();
            
            // Limit decimal places to 2 (Optional, useful for JSON)
            percentage = Math.round(percentage * 100.0) / 100.0;

            healthMap.put(env.name(), percentage);
        }

        return healthMap;
    }

    public Map<String, Boolean> getComponentRunStatus(Long componentId) {
        Map<String, Boolean> statusMap = new HashMap<>();

        // Iterate through DEV, STG, PROD
        for (AppEnvironment env : AppEnvironment.values()) {
            Optional<Deployment> latestDeployment = deploymentRepository
                    .findTopByComponentIdAndEnvironmentOrderByCreatedAtDesc(componentId, env);

            // True ONLY if deployment exists AND is currently RUNNING
            boolean isRunning = latestDeployment.isPresent() && 
                                latestDeployment.get().getStatus() == Deployment.DeploymentStatus.RUNNING;

            statusMap.put(env.name(), isRunning);
        }

        return statusMap;
    }
}