package com.cloud.core.repository;

import com.cloud.core.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeploymentRepository extends JpaRepository<Deployment, String> {
}