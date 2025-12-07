package com.cloud.orchestrator.controller;

import com.cloud.orchestrator.service.DockerService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
        String gitToken = (String) payload.get("gitToken");
        String subdomain = (String) payload.get("subdomain");
        if (subdomain == null || subdomain.isEmpty()) {
            subdomain = "app-" + deploymentId;
        }
        Map<String, String> env = new HashMap<>();
        Object envObj = payload.get("env");
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
        
        int port = 8080;
        if (payload.containsKey("port")) {
            port = Integer.parseInt(payload.get("port").toString());
        }
        
        return dockerService.deployProject(deploymentId, repo, branch, buildPath, port, subdomain, commitSha, env, gitToken);
    }
}