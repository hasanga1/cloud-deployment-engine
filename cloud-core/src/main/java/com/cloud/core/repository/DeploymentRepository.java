package com.cloud.core.repository;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeploymentRepository extends JpaRepository<Deployment, String> {
    List<Deployment> findAllByComponentIdOrderByCreatedAtDesc(Long componentId);
    Optional<Deployment> findTopByComponentIdAndEnvironmentOrderByCreatedAtDesc(Long componentId, AppEnvironment environment);
}