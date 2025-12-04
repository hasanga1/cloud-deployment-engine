package com.cloud.core.controller;

import com.cloud.core.service.DeploymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {
    
    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    @PostMapping("/{id}/stop")
    public void stopDeployment(@PathVariable String id) {
        deploymentService.stopDeployment(id);
    }
}