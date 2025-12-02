package com.cloud.core.service;

import com.cloud.core.entity.Deployment;
import com.cloud.core.entity.Project;
import com.cloud.core.repository.DeploymentRepository;
import com.cloud.core.repository.ProjectRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DeploymentService {

    private final ProjectRepository projectRepository;
    private final DeploymentRepository deploymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public DeploymentService(ProjectRepository projectRepository, 
                             DeploymentRepository deploymentRepository,
                             KafkaTemplate<String, Object> kafkaTemplate) {
        this.projectRepository = projectRepository;
        this.deploymentRepository = deploymentRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    public Deployment triggerDeployment(Long projectId) {
        // 1. Fetch Project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // 2. Create Deployment Record (Status: QUEUED)
        Deployment deployment = new Deployment();
        deployment.setProject(project);
        deployment.setStatus(Deployment.DeploymentStatus.QUEUED);
        deploymentRepository.save(deployment);

        // 3. Prepare Payload for Orchestrator
        Map<String, Object> message = new HashMap<>();
        message.put("deploymentId", deployment.getId());
        message.put("repoUrl", project.getRepoUrl());
        message.put("branch", project.getBranch());
        message.put("buildPath", project.getBuildPath());
        message.put("port", project.getPort());
        message.put("subdomain", project.getSubdomain());

        // 4. Send to Kafka
        kafkaTemplate.send("deployments.trigger", message);
        
        System.out.println("🚀 Triggered Deployment: " + deployment.getId());

        return deployment;
    }
}