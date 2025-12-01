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
        String repo = (String) payload.get("repoUrl");
        String branch = (String) payload.getOrDefault("branch", "main");
        
        // Read the port, default to 8080 if user doesn't send it
        // We use String parsing safely in case it comes as a string "3000" or int 3000
        int port = 8080;
        if (payload.containsKey("port")) {
            port = Integer.parseInt(payload.get("port").toString());
        }
        
        return dockerService.deployProject(repo, branch, port);
    }
}