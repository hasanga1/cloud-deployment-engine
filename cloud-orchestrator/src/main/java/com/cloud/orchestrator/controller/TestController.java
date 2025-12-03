package com.cloud.orchestrator.controller;

import com.cloud.orchestrator.service.DockerService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    private final DockerService dockerService;

    public TestController(DockerService dockerService) {
        this.dockerService = dockerService;
    }

    @PostMapping("/deploy")
    public String triggerDeploy(@RequestBody Map<String, Object> payload) throws Exception {
        String deploymentId = (String) payload.get("deploymentId"); 
        String repo = (String) payload.get("repoUrl");
        String branch = (String) payload.getOrDefault("branch", "main");
        
        // Default to root "/" if not provided
        String buildPath = (String) payload.getOrDefault("buildPath", "."); 
        String commitSha = (String) payload.get("commitSha");
        String subdomain = (String) payload.get("subdomain");
        if (subdomain == null || subdomain.isEmpty()) {
            subdomain = "app-" + deploymentId;
        }
        
        int port = 8080;
        if (payload.containsKey("port")) {
            port = Integer.parseInt(payload.get("port").toString());
        }
        
        return dockerService.deployProject(deploymentId, repo, branch, buildPath, port, subdomain, commitSha);
    }
}