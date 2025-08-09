package com.substring.chat.controllers;

import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"},
        allowCredentials = "true",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // Inner classes for request/response DTOs
    public static class SignupRequest {
        private String username;
        private String email;
        private String password;
        private String fullName;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }

    public static class SigninRequest {
        private String usernameOrEmail;
        private String password;

        // Getters and setters
        public String getUsernameOrEmail() { return usernameOrEmail; }
        public void setUsernameOrEmail(String usernameOrEmail) { this.usernameOrEmail = usernameOrEmail; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody SignupRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== SIGNUP REQUEST ===");
            System.out.println("Username: " + request.getUsername());
            System.out.println("Email: " + request.getEmail());
            System.out.println("FullName: " + request.getFullName());

            // Validation
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Username is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getPassword() == null || request.getPassword().length() < 3) {
                response.put("success", false);
                response.put("message", "Password must be at least 3 characters");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if user already exists
            if (userRepository.existsByUsername(request.getUsername())) {
                response.put("success", false);
                response.put("message", "Username already exists");
                return ResponseEntity.badRequest().body(response);
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                response.put("success", false);
                response.put("message", "Email already exists");
                return ResponseEntity.badRequest().body(response);
            }

            // Create new user
            User user = new User();
            user.setUsername(request.getUsername().trim());
            user.setEmail(request.getEmail().trim().toLowerCase());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFullName(request.getFullName() != null ? request.getFullName().trim() : request.getUsername());
            user.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            user.setActive(true);

            User savedUser = userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getId(), savedUser.getEmail());

            // Prepare user data (exclude password)
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", savedUser.getId());
            userData.put("username", savedUser.getUsername());
            userData.put("email", savedUser.getEmail());
            userData.put("fullName", savedUser.getFullName());
            userData.put("createdAt", savedUser.getCreatedAt());

            response.put("success", true);
            response.put("message", "User created successfully");
            response.put("token", token);
            response.put("user", userData);

            System.out.println("User created successfully: " + savedUser.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("Signup error: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<Map<String, Object>> signin(@RequestBody SigninRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== SIGNIN REQUEST ===");
            System.out.println("UsernameOrEmail: " + request.getUsernameOrEmail());

            // Validation
            if (request.getUsernameOrEmail() == null || request.getUsernameOrEmail().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Username/email is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getPassword() == null || request.getPassword().isEmpty()) {
                response.put("success", false);
                response.put("message", "Password is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Find user by username or email
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(
                    request.getUsernameOrEmail().trim(),
                    request.getUsernameOrEmail().trim().toLowerCase()
            );

            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Invalid credentials");
                return ResponseEntity.badRequest().body(response);
            }

            User user = userOpt.get();

            // Check password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                response.put("success", false);
                response.put("message", "Invalid credentials");
                return ResponseEntity.badRequest().body(response);
            }

            // Update last login
            user.setLastLoginAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getEmail());

            // Prepare user data (exclude password)
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("fullName", user.getFullName());
            userData.put("lastLoginAt", user.getLastLoginAt());

            response.put("success", true);
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("user", userData);

            System.out.println("User signed in successfully: " + user.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("Signin error: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("valid", false);
                response.put("message", "Invalid token format");
                return ResponseEntity.badRequest().body(response);
            }

            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {
                response.put("valid", true);
                response.put("message", "Token is valid");
                return ResponseEntity.ok(response);
            } else {
                response.put("valid", false);
                response.put("message", "Invalid token");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            System.out.println("Token validation error: " + e.getMessage());
            response.put("valid", false);
            response.put("message", "Token validation failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Handle preflight requests
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
}