package com.cloud.auth.controller;

import com.cloud.auth.dto.UserResponse;
import com.cloud.auth.entity.User;
import com.cloud.auth.repository.UserRepository;
import com.cloud.auth.util.JwtUtils;
import com.cloud.auth.dto.UpdateProfileRequest;
import com.cloud.auth.dto.ChangePasswordRequest;

import lombok.Data;

import com.cloud.auth.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.List;

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

    @GetMapping("/user")
    public ResponseEntity<?> getUserDetails(@RequestHeader("Authorization") String token) {
        try {
            // 1. Clean the token
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            // 2. Validate Token
            if (!jwtUtils.validateToken(token)) {
                return ResponseEntity.status(401).body("Invalid or Expired Token");
            }

            // 3. Extract User ID
            Long userId = jwtUtils.getUserIdFromToken(token);

            // 4. Find User in DB
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 5. Convert to DTO (Excluding Password)
            UserResponse response = new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
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

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String token, 
                                           @RequestBody UpdateProfileRequest request) {
        
        System.out.println("Update Profile Request: " + request);
        Long userId = extractUserId(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update fields if they are provided
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());

        userRepository.save(user);
        
        return ResponseEntity.ok("Profile updated successfully");
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String token, 
                                            @RequestBody ChangePasswordRequest request) {
        Long userId = extractUserId(token);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // A. Verify Old Password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Incorrect old password");
        }

        // B. Validate New Password Strength (Reuse your existing helper)
        if (!isValidPassword(request.getNewPassword())) {
            return ResponseEntity.badRequest().body("New password is too weak. Must contain 8+ chars, uppercase, number, symbol.");
        }

        // C. Update Password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("Password changed successfully");
    }

    private Long extractUserId(String token) {
        System.out.println("Extracting user ID from token: " + token);
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtUtils.getUserIdFromToken(token);
    }

    @PostMapping("/users/batch")
    public ResponseEntity<List<UserResponse>> getUsersBatch(@RequestBody List<Long> userIds) {
        List<User> users = userRepository.findAllById(userIds);
        
        List<UserResponse> response = users.stream()
                .map(u -> new UserResponse(u.getId(), u.getEmail(), u.getFirstName(), u.getLastName()))
                .toList();
                
        return ResponseEntity.ok(response);
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