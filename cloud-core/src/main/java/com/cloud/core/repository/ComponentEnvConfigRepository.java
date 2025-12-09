package com.cloud.core.repository;

import com.cloud.core.entity.AppEnvironment;
import com.cloud.core.entity.ComponentEnvConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ComponentEnvConfigRepository extends JpaRepository<ComponentEnvConfig, Long> {
    Optional<ComponentEnvConfig> findByComponentIdAndEnvironment(Long componentId, AppEnvironment environment);
}