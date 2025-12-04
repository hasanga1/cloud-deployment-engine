package com.cloud.orchestrator.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DeploymentConsumer {

    private final DockerService dockerService;

    public DeploymentConsumer(DockerService dockerService) {
        this.dockerService = dockerService;
    }

    @KafkaListener(topics = "deployments.trigger", groupId = "orchestrator-group")
    public void listen(Map<String, Object> message) {
        try {
            System.out.println("📬 Received Deployment Trigger: " + message);

            // Extract data safely
            String deploymentId = (String) message.get("deploymentId");
            String repoUrl = (String) message.get("repoUrl");
            String branch = (String) message.getOrDefault("branch", "main");
            String buildPath = (String) message.getOrDefault("buildPath", ".");
            int port = (int) message.getOrDefault("port", 8080);
            String subdomain = (String) message.get("subdomain");
            String commitSha = (String) message.get("commitSha");
    // Safely extract environment variables map with type checks
    Map<String, String> env = new HashMap<>();
    Object envObj = message.get("env");
    if (envObj instanceof Map) {
        Map<?, ?> rawEnv = (Map<?, ?>) envObj;
        for (Map.Entry<?, ?> entry : rawEnv.entrySet()) {
            Object k = entry.getKey();
            Object v = entry.getValue();
            if (k != null && v != null) {
                env.put(k.toString(), v.toString());
            }
        }
    }

    // Fallback if null (for backward compatibility)
    if (subdomain == null || subdomain.isEmpty()) {
        subdomain = "app-" + message.get("deploymentId");
    }

            // TRIGGER THE BUILD 🏗️
            dockerService.deployProject(deploymentId, repoUrl, branch, buildPath, port, subdomain, commitSha, env);

        } catch (Exception e) {
            System.err.println("❌ Deployment Failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}