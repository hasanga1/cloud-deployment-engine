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

    public String deployProject(String deploymentId, String repoUrl, String branch, String buildPath, int internalPort, String subdomain, String commitSha) throws Exception {
    
        // 1. USE DEPLOYMENT ID FOR EVERYTHING (Consistency!)
        // Instead of a random UUID, we use the ID from the database.
        String appName = "app-" + deploymentId; 
        String subdomainUrl = "http://" + subdomain + ".localhost";

        sendUpdate(deploymentId, "IN_PROGRESS");

        try {
            // --- CLONE ---
            kafkaTemplate.send("deployment-logs", "⬇️ Cloning repository...");
            File repoRoot = cloneRepository(repoUrl, branch, commitSha);
            
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

            String hostRule = "Host(`" + subdomain + ".localhost`)"; 

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
                        "traefik.http.routers." + subdomain + ".rule", hostRule, // Router Name = Subdomain
                        "traefik.http.routers." + subdomain + ".entrypoints", "web",
                        "traefik.http.services." + subdomain + ".loadbalancer.server.port", String.valueOf(internalPort)
                    ))
                    .exec();

            dockerClient.startContainerCmd(appName).exec();

            // ✅ RUNNING: Send the Magic URL
            sendUpdate(deploymentId, "RUNNING");
            kafkaTemplate.send("deployment-logs", "✅ Deployment Successful! Access App: " + subdomainUrl);

            return subdomainUrl;

        } catch (Exception e) {
            sendUpdate(deploymentId, "FAILED");
            kafkaTemplate.send("deployment-logs", "❌ Deployment Failed: " + e.getMessage());
            throw e; 
        }
    }

    // --- Helper Methods ---

    private File cloneRepository(String repoUrl, String branch, String commitSha) throws Exception {
        Path tempDir = Files.createTempDirectory("cloud-build-");
        Git git = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(tempDir.toFile())
                .setBranch(branch)
                .call();

        if (commitSha != null && !commitSha.isEmpty()) {
            System.out.println("🔀 Checking out commit: " + commitSha);
            git.checkout().setName(commitSha).call();
        }

        git.close();

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

    public void stopContainer(String deploymentId) {
        String containerName = "app-" + deploymentId;
        try {
            System.out.println("🛑 Stopping container: " + containerName);
            
            // 1. Stop it
            dockerClient.stopContainerCmd(containerName).exec();
            System.out.println("✅ Container stopped successfully");
            
            // 2. Remove it (So it doesn't clutter Docker)
            // If you want to "Restart" later, you'd need to just stop. 
            // But usually "Stop" in PaaS means "Kill".
            dockerClient.removeContainerCmd(containerName).exec();
            System.out.println("✅ Container removed successfully");
            
            sendUpdate(deploymentId, "STOPPED"); // Notify Core
        } catch (Exception e) {
            System.err.println("Failed to stop container: " + e.getMessage());
            // It might already be stopped or not exist
        }
    }
}