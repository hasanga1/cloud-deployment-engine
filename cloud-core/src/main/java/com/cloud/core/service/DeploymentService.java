package com.cloud.core.service;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.entity.ProjectEnvConfig;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.util.EncryptionUtil;
import com.cloud.core.repository.ProjectEnvConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class DeploymentService {

    private final ProjectRepository projectRepository;
    private final DeploymentRepository deploymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final EncryptionUtil encryptionUtil;
    private final ProjectEnvConfigRepository envConfigRepository;

    public DeploymentService(ProjectRepository projectRepository, 
                             DeploymentRepository deploymentRepository,
                             KafkaTemplate<String, Object> kafkaTemplate,
                             EncryptionUtil encryptionUtil,
                             ProjectEnvConfigRepository envConfigRepository) {
        this.projectRepository = projectRepository;
        this.deploymentRepository = deploymentRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.encryptionUtil = encryptionUtil;
        this.envConfigRepository = envConfigRepository;
    }

    public Deployment triggerDeployment(Long projectId, String commitSha, AppEnvironment env) {
        // 1. Fetch Project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        String gitToken = null;
        if (project.getGitToken() != null && !project.getGitToken().isEmpty()) {
            try {
                gitToken = encryptionUtil.decrypt(project.getGitToken());
            } catch (Exception e) {
                System.err.println("Failed to decrypt git token");
            }
        }

        Map<String, String> envVars = new HashMap<>();
        Optional<ProjectEnvConfig> config = envConfigRepository.findByProjectIdAndEnvironment(projectId, env);

        if (config.isPresent()) {
            try {
                String decrypted = encryptionUtil.decrypt(config.get().getEncryptedEnvs());
                envVars = new ObjectMapper().readValue(decrypted, Map.class);
            } catch (Exception e) {
                System.err.println("Failed to decrypt vars");
            }
        }

        // 2. Generate Subdomain based on Environment logic
        String finalSubdomain = project.getSubdomain();
        if (env == AppEnvironment.DEV) {
            finalSubdomain += "-dev";
        } else if (env == AppEnvironment.STG) {
            finalSubdomain += "-stg";
        }

        // 2. Create Deployment Record (Status: QUEUED)
        Deployment deployment = new Deployment();
        deployment.setProject(project);
        deployment.setStatus(Deployment.DeploymentStatus.QUEUED);
        deployment.setCommitSha(commitSha);
        deploymentRepository.save(deployment);

        // 3. Prepare Payload for Orchestrator
        Map<String, Object> message = new HashMap<>();
        message.put("deploymentId", deployment.getId());
        message.put("repoUrl", project.getRepoUrl());
        message.put("branch", project.getBranch());
        message.put("buildPath", project.getBuildPath());
        message.put("port", project.getPort());
        message.put("subdomain", finalSubdomain);
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
}