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
    public String triggerDeploy(@RequestBody Map<String, String> payload) throws Exception {
        String repo = payload.get("repoUrl");
        String branch = payload.getOrDefault("branch", "main");
        
        return dockerService.deployProject(repo, branch);
    }
}