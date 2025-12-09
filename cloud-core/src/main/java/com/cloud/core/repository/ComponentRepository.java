package com.cloud.core.repository;
import com.cloud.core.entity.Component;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComponentRepository extends JpaRepository<Component, Long> {
    boolean existsBySubdomain(String subdomain);
    List<Component> findAllByProjectId(Long projectId);
}