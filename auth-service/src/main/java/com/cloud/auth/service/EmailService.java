package com.cloud.auth.service;

import com.cloud.auth.entity.EmailVerification;
import com.cloud.auth.entity.PasswordResetToken;
import com.cloud.auth.repository.VerificationRepository;
import com.cloud.auth.repository.PasswordResetTokenRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final VerificationRepository verificationRepository;
    private final PasswordResetTokenRepository resetTokenRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender, VerificationRepository verificationRepository, PasswordResetTokenRepository resetTokenRepository) {
        this.mailSender = mailSender;
        this.verificationRepository = verificationRepository;
        this.resetTokenRepository = resetTokenRepository;
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

    public void sendPasswordResetLink(String email) {
        String token = UUID.randomUUID().toString();

        // Save token to DB...
        PasswordResetToken resetToken = new PasswordResetToken(
                token,
                email,
                LocalDateTime.now().plusHours(24)
        );
        resetTokenRepository.save(resetToken);

        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Reset Your Password");
        message.setText("Click here to reset: " + resetUrl);

        mailSender.send(message);
    }

    public String validatePasswordResetToken(String token) {
        return resetTokenRepository.findByToken(token)
                .map(t -> {
                    if (t.getExpiryDate().isBefore(LocalDateTime.now())) {
                        return "EXPIRED";
                    }
                    return t.getEmail(); // Return the email associated with the token
                })
                .orElse(null); // Token not found
    }
    
    public void deleteResetToken(String token) {
        resetTokenRepository.deleteById(token);
    }
}