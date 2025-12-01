package com.cloud.orchestrator.service;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.BuildImageResultCallback;
import com.github.dockerjava.api.model.BuildResponseItem;
import com.github.dockerjava.api.model.ExposedPort;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.PortBinding;
import com.github.dockerjava.api.model.Ports;
import org.eclipse.jgit.api.Git;
import org.springframework.stereotype.Service;
import org.springframework.kafka.core.KafkaTemplate;

import java.io.File;
import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.UUID;

@Service
public class DockerService {

    private final DockerClient dockerClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public DockerService(DockerClient dockerClient, KafkaTemplate<String, String> kafkaTemplate) {
        this.dockerClient = dockerClient;
        this.kafkaTemplate = kafkaTemplate;
    }

    public String deployProject(String repoUrl, String branch, String buildPath, int internalPort) throws Exception {
    
        String projectId = UUID.randomUUID().toString().substring(0, 8);
        String imageName = "app-" + projectId;

        // 1. CLONE (Always clone the whole repo)
        kafkaTemplate.send("deployment-logs", "Cloning repository...");
        File repoRoot = cloneRepository(repoUrl, branch);
        
        // 2. DETERMINE BUILD CONTEXT
        // If user says build path is "/backend", we point Docker there.
        File buildDir = new File(repoRoot, buildPath); 
        
        if (!buildDir.exists()) {
            throw new RuntimeException("Build path does not exist: " + buildDir.getAbsolutePath());
        }

        kafkaTemplate.send("deployment-logs", "Building from context: " + buildPath);

        // 3. BUILD IMAGE
        String imageId = dockerClient.buildImageCmd(buildDir)
                .withTags(Collections.singleton(imageName))
                // .withDockerfile(new File(buildDir, "Dockerfile.dev")) // Optional: if you want to support custom filenames
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

        // 4. RUN CONTAINER (With Multiple Ports Logic if needed)
        int hostPort = findFreePort();
        
        System.out.println("⚡ Mapping Host Port " + hostPort + " -> Container Port " + internalPort);

        dockerClient.createContainerCmd(imageId)
                .withName(imageName)
                .withHostConfig(HostConfig.newHostConfig()
                        .withPortBindings(new PortBinding(
                                Ports.Binding.bindPort(hostPort), 
                                new ExposedPort(internalPort))) 
                )
                .exec();

        dockerClient.startContainerCmd(imageName).exec();

        return "http://localhost:" + hostPort;
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
}