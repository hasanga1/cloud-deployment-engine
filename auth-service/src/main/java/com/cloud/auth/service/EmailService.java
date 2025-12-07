package com.cloud.auth.service;

import com.cloud.auth.entity.EmailVerification;
import com.cloud.auth.repository.VerificationRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final VerificationRepository verificationRepository;

    public EmailService(JavaMailSender mailSender, VerificationRepository verificationRepository) {
        this.mailSender = mailSender;
        this.verificationRepository = verificationRepository;
    }

    public void sendVerificationCode(String email) {
        // 1. Generate 6-digit Code
        String code = String.valueOf(new Random().nextInt(900000) + 100000);

        // 2. Save to DB (1 Minute Expiry)
        EmailVerification verification = new EmailVerification(
                email,
                code,
                LocalDateTime.now().plusMinutes(1) // ⏳ 1 Minute Lifetime
        );
        verificationRepository.save(verification);

        // 3. Send Email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your Verification Code");
        message.setText("Your code is: " + code + "\n\nIt expires in 1 minute.");
        
        mailSender.send(message);
        System.out.println("📧 Sent code " + code + " to " + email);
    }

    public boolean verifyCode(String email, String code) {
        return verificationRepository.findById(email)
                .map(v -> {
                    // Check if code matches AND is not expired
                    if (v.getVerificationCode().equals(code) && 
                        v.getExpiryTime().isAfter(LocalDateTime.now())) {
                        verificationRepository.delete(v); // Cleanup after success
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }
}