package com.cloud.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class ControlConsumer {

    private final DockerService dockerService;
    private final ObjectMapper objectMapper;

    public ControlConsumer(DockerService dockerService) {
        this.dockerService = dockerService;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "deployments.control", groupId = "orchestrator-control-group")
    public void listen(String message) {
        try {
            Map<String, String> payload = objectMapper.readValue(message, Map.class);
            String deploymentId = payload.get("deploymentId");
            String action = payload.get("action");

            if ("STOP".equals(action)) {
                dockerService.stopContainer(deploymentId);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}