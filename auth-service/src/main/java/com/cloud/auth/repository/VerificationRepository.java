package com.cloud.auth.repository;

import com.cloud.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationRepository extends JpaRepository<EmailVerification, String> {
}