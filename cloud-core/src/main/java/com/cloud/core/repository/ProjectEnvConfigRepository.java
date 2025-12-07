package com.cloud.core.repository;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.ProjectEnvConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProjectEnvConfigRepository extends JpaRepository<ProjectEnvConfig, Long> {
    Optional<ProjectEnvConfig> findByProjectIdAndEnvironment(Long projectId, AppEnvironment environment);
}