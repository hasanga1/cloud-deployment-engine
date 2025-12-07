package com.cloud.core.service;

import com.cloud.core.entity.Deployment;
import com.cloud.core.repository.DeploymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StatusConsumer {

    private final DeploymentRepository deploymentRepository;
    private final ObjectMapper objectMapper;

    public StatusConsumer(DeploymentRepository deploymentRepository) {
        this.deploymentRepository = deploymentRepository;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "deployments.status", groupId = "core-status-group")
    public void consumeStatus(String message) {
        try {
            Map<String, String> update = objectMapper.readValue(message, Map.class);
            String id = update.get("deploymentId");
            String status = update.get("status"); // "RUNNING" or "STOPPED"

            Deployment deployment = deploymentRepository.findById(id).orElseThrow();
            
            // This automatically handles the new Enums
            deployment.setStatus(Deployment.DeploymentStatus.valueOf(status));
            
            deploymentRepository.save(deployment);
            System.out.println("🔄 DB Updated: " + id + " -> " + status);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}