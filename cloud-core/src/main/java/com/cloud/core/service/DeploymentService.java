package com.cloud.core.service;

import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.repository.ProjectRepository;
import com.cloud.core.util.EncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DeploymentService {

    private final ProjectRepository projectRepository;
    private final DeploymentRepository deploymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final EncryptionUtil encryptionUtil;

    public DeploymentService(ProjectRepository projectRepository, 
                             DeploymentRepository deploymentRepository,
                             KafkaTemplate<String, Object> kafkaTemplate,
                             EncryptionUtil encryptionUtil) {
        this.projectRepository = projectRepository;
        this.deploymentRepository = deploymentRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.encryptionUtil = encryptionUtil;
    }

    public Deployment triggerDeployment(Long projectId, String commitSha) {
        // 1. Fetch Project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Map<String, String> envVars = new HashMap<>();
        if (project.getEnvs() != null && !project.getEnvs().isEmpty()) {
            try {
                String decryptedJson = encryptionUtil.decrypt(project.getEnvs());
                envVars = new ObjectMapper().readValue(decryptedJson, Map.class);
            } catch (Exception e) {
                System.err.println("Failed to decrypt envs for deployment");
            }
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
        message.put("subdomain", project.getSubdomain());
        message.put("commitSha", commitSha);
        message.put("env", envVars);

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