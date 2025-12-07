package com.cloud.auth.controller;

import com.cloud.auth.entity.User;
import com.cloud.auth.repository.UserRepository;
import com.cloud.auth.util.JwtUtils;

import lombok.Data;

import com.cloud.auth.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
    }

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        emailService.sendVerificationCode(email);
        return ResponseEntity.ok("Verification code sent to " + email);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        // Security Note: Usually we shouldn't tell if an email exists or not to prevent 
        // user enumeration, but for this project, checking existence is fine.
        if (!userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body("Email not found");
        }

        emailService.sendPasswordResetLink(email);
        return ResponseEntity.ok("Password reset link sent to your email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        
        // A. Validate Token
        String email = emailService.validatePasswordResetToken(request.getToken());
        
        if (email == null) {
            return ResponseEntity.badRequest().body("Invalid Token");
        } else if (email.equals("EXPIRED")) {
            return ResponseEntity.badRequest().body("Link has expired");
        }

        // B. Validate Password Strength (Reuse your helper)
        if (!isValidPassword(request.getNewPassword())) {
            return ResponseEntity.badRequest().body("Password too weak");
        }

        // C. Update Password
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // D. Delete used token so it can't be used again
        emailService.deleteResetToken(request.getToken());

        return ResponseEntity.ok("Password successfully updated");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email taken");
        }

        if (!emailService.verifyCode(request.getEmail(), request.getCode())) {
            return ResponseEntity.badRequest().body("Invalid or Expired Verification Code");
        }

        if (!isValidPassword(request.getPassword())) {
            return ResponseEntity.badRequest().body("Password must have 8+ chars, 1 uppercase, 1 number, and 1 special symbol.");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("User registered");
    }

    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> emailRequest) {
        String email = emailRequest.get("email");
        boolean exists = userRepository.existsByEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
        String token = jwtUtils.generateToken(user.getEmail(), user.getId());
        return ResponseEntity.ok(Map.of("token", token));
    }

    // --- Helper Method ---
    private boolean isValidPassword(String password) {
        if (password == null) return false;

        // Java Regex requires double backslashes for escaping
        boolean hasLength  = password.length() >= 8;
        boolean hasUpper   = Pattern.compile("[A-Z]").matcher(password).find();
        boolean hasNumber  = Pattern.compile("[0-9]").matcher(password).find();
        boolean hasSpecial = Pattern.compile("[!@#$%^&*(),.?\":{}|<>]").matcher(password).find();

        return hasLength && hasUpper && hasNumber && hasSpecial;
    }
}

@Data
class RegisterRequest {
    private String email;
    private String firstName;
    private String lastName;
    private String password;
    private String code;
}

@Data
class ResetPasswordRequest {
    private String token;
    private String newPassword;
}