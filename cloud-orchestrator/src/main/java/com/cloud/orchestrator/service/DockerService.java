package com.cloud.orchestrator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.BuildImageResultCallback;
import com.github.dockerjava.api.model.BuildResponseItem;
import com.github.dockerjava.api.model.ExposedPort;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.PortBinding;
import com.github.dockerjava.api.model.Ports;
import org.eclipse.jgit.api.Git;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class DockerService {

    private final DockerClient dockerClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    // Inject the value from application.properties
    @Value("${docker.network.name}")
    private String dockerNetwork;

    public DockerService(DockerClient dockerClient, KafkaTemplate<String, String> kafkaTemplate) {
        this.dockerClient = dockerClient;
        this.kafkaTemplate = kafkaTemplate;
    }

    public String deployProject(String deploymentId, String repoUrl, String branch, String buildPath, int internalPort) throws Exception {
    
        // 1. USE DEPLOYMENT ID FOR EVERYTHING (Consistency!)
        // Instead of a random UUID, we use the ID from the database.
        String appName = "app-" + deploymentId; 
        String subdomainUrl = "http://" + appName + ".localhost"; // The "Magic URL"

        sendUpdate(deploymentId, "IN_PROGRESS");

        try {
            // --- CLONE ---
            kafkaTemplate.send("deployment-logs", "⬇️ Cloning repository...");
            File repoRoot = cloneRepository(repoUrl, branch);
            
            // --- PREPARE BUILD ---
            File buildDir = new File(repoRoot, buildPath); 
            if (!buildDir.exists()) {
                throw new RuntimeException("Build path does not exist: " + buildPath);
            }
            kafkaTemplate.send("deployment-logs", "🔨 Building Docker image from: " + buildPath);

            // --- BUILD IMAGE ---
            String imageId = dockerClient.buildImageCmd(buildDir)
                    .withTags(Collections.singleton(appName)) // Tag image with appName
                    .exec(new BuildImageResultCallback() {
                        @Override
                        public void onNext(BuildResponseItem item) {
                            if (item.getStream() != null) {
                                String log = item.getStream().trim();
                                if (!log.isEmpty()) {
                                    kafkaTemplate.send("deployment-logs", log);
                                }
                            }
                            super.onNext(item);
                        }
                    })
                    .awaitImageId();

            // --- RUN CONTAINER ---
            int hostPort = findFreePort();
            
            // Traefik Rule: "If Host matches app-123.localhost, send here"
            String hostRule = "Host(`" + appName + ".localhost`)";

            System.out.println("🏷️ Traefik Label: " + hostRule);
            kafkaTemplate.send("deployment-logs", "⚡ Starting container with Traefik Proxy...");

            dockerClient.createContainerCmd(imageId)
                    .withName(appName) // Name the container app-{deploymentId}
                    .withHostConfig(HostConfig.newHostConfig()
                            .withPortBindings(new PortBinding(
                                    Ports.Binding.bindPort(hostPort), 
                                    new ExposedPort(internalPort))) 
                            .withNetworkMode(dockerNetwork)
                    )
                    // --- TRAEFIK LABELS ---
                    .withLabels(Map.of(
                            "traefik.enable", "true",
                            "traefik.http.routers." + appName + ".rule", hostRule,
                            "traefik.http.routers." + appName + ".entrypoints", "web",
                            // Important: Tell Traefik to route to the INTERNAL port (e.g. 5000), not the random host port
                            "traefik.http.services." + appName + ".loadbalancer.server.port", String.valueOf(internalPort)
                    ))
                    .exec();

            dockerClient.startContainerCmd(appName).exec();

            // ✅ SUCCESS: Send the Magic URL
            sendUpdate(deploymentId, "SUCCESS");
            kafkaTemplate.send("deployment-logs", "✅ Deployment Successful! Access App: " + subdomainUrl);

            return subdomainUrl;

        } catch (Exception e) {
            sendUpdate(deploymentId, "FAILED");
            kafkaTemplate.send("deployment-logs", "❌ Deployment Failed: " + e.getMessage());
            throw e; 
        }
    }

    // --- Helper Methods ---

    private File cloneRepository(String repoUrl, String branch) throws Exception {
        Path tempDir = Files.createTempDirectory("cloud-build-");
        Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(tempDir.toFile())
                .setBranch(branch)
                .call();
        return tempDir.toFile();
    }

    private int findFreePort() {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (IOException e) {
            throw new RuntimeException("No available ports", e);
        }
    }

    private void sendUpdate(String deploymentId, String status) {
        try {
            Map<String, String> update = new HashMap<>();
            update.put("deploymentId", deploymentId);
            update.put("status", status);
            String json = new ObjectMapper().writeValueAsString(update);
            kafkaTemplate.send("deployments.status", json);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}