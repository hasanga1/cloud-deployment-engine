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

    public String deployProject(String repoUrl, String branch, int internalPort) throws Exception {
    
        String projectId = UUID.randomUUID().toString().substring(0, 8);
        String imageName = "app-" + projectId;

        // Notify start
        kafkaTemplate.send("deployment-logs", "Starting build for " + projectId);

        File projectDir = cloneRepository(repoUrl, branch);

        // Build the Image (Same as before)
        String imageId = dockerClient.buildImageCmd(projectDir)
                .withTags(Collections.singleton(imageName))
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

        // --- PORT CONFIGURATION ---
        int hostPort = findFreePort();
        
        // REMOVE the hardcoded 8080
        // int containerInternalPort = 8080; 
        
        // USE the variable passed in
        System.out.println("⚡ Mapping Host Port " + hostPort + " -> Container Port " + internalPort);

        dockerClient.createContainerCmd(imageId)
                .withName(imageName)
                .withHostConfig(HostConfig.newHostConfig()
                        .withPortBindings(new PortBinding(
                                Ports.Binding.bindPort(hostPort), 
                                new ExposedPort(internalPort))) // Use the variable here!
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