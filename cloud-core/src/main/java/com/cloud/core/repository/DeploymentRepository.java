package com.cloud.core.repository;

import com.cloud.core.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeploymentRepository extends JpaRepository<Deployment, String> {
    List<Deployment> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);
}