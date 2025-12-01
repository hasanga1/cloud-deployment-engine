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

    public DockerService(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
    }

    public String deployProject(String repoUrl, String branch) throws Exception {
        
        // 1. PROJECT ID / BUILD TAG
        String projectId = UUID.randomUUID().toString().substring(0, 8);
        String imageName = "app-" + projectId;
        
        // 2. CLONE REPOSITORY
        File projectDir = cloneRepository(repoUrl, branch);
        System.out.println("✅ Cloned to: " + projectDir.getAbsolutePath());

        // 3. BUILD IMAGE
        // We attach a callback to print logs to console (later we send to Kafka)
        String imageId = dockerClient.buildImageCmd(projectDir)
                .withTags(Collections.singleton(imageName))
                .exec(new BuildImageResultCallback() {
                    @Override
                    public void onNext(BuildResponseItem item) {
                        if (item.getStream() != null) {
                            System.out.print("Build Log: " + item.getStream());
                        }
                        super.onNext(item);
                    }
                })
                .awaitImageId();
        
        System.out.println("✅ Image Built: " + imageId);

        // 4. RUN CONTAINER
        int hostPort = findFreePort();
        int containerInternalPort = 8080; // Assuming the user's Dockerfile EXPOSE 8080

        dockerClient.createContainerCmd(imageId)
                .withName(imageName)
                .withHostConfig(HostConfig.newHostConfig()
                        .withPortBindings(new PortBinding(
                                Ports.Binding.bindPort(hostPort), 
                                new ExposedPort(containerInternalPort)))
                )
                .exec();

        dockerClient.startContainerCmd(imageName).exec();

        System.out.println("✅ Container Running on Port: " + hostPort);
        
        // 5. CLEANUP
        // TODO: Delete projectDir to save space
        
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