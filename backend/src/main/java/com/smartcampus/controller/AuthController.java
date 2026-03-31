// src/main/java/com/smartcampus/controller/AuthController.java
package com.smartcampus.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtils jwtUtils, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
    }

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    // Called by React after receiving the token — fetches logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            log.warn("Authentication is null for GET /api/auth/me request");
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        
        String email = (String) authentication.getPrincipal();
        log.debug("Fetching user profile for email: {}", email);
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.warn("User profile not found for email: {}", email);
                        return new RuntimeException("User not found");
                    });
            
            log.info("Successfully retrieved user profile - Email: {}, Role: {}", email, user.getRole().name());
            
            // Use LinkedHashMap to allow null values (picture field may be null)
            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("id", user.getId());
            response.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
            response.put("lastName", user.getLastName() != null ? user.getLastName() : "");
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("picture", user.getPicture());
            response.put("role", user.getRole().name());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching user profile for email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to fetch profile: " + e.getMessage()));
        }
    }

    // Update user profile - for normal users
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody Map<String, String> request) {
        if (authentication == null) {
            log.warn("Authentication is null for PUT /api/auth/profile request");
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        
        String email = (String) authentication.getPrincipal();
        log.info("Processing profile update request for email: {}", email);
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.warn("User not found for email: {}", email);
                        return new RuntimeException("User not found");
                    });

            // Update fields if provided
            String firstName = request.get("firstName");
            String lastName = request.get("lastName");
            String newEmail = request.get("email");

            if (firstName != null && !firstName.isEmpty()) {
                user.setFirstName(firstName);
                log.debug("Updated firstName for user: {}", email);
            }

            if (lastName != null && !lastName.isEmpty()) {
                user.setLastName(lastName);
                log.debug("Updated lastName for user: {}", email);
            }

            // Update name field for backward compatibility
            String combinedName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
            user.setName(combinedName);

            // Email can only be updated if not already taken
            if (newEmail != null && !newEmail.isEmpty() && !newEmail.equals(user.getEmail())) {
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    log.warn("Email already in use: {}", newEmail);
                    return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
                }
                user.setEmail(newEmail);
                log.debug("Updated email for user: {} -> {}", email, newEmail);
            }

            User updatedUser = userRepository.save(user);
            log.info("Profile updated successfully for user: {}", email);

            // Use LinkedHashMap to allow null values (picture field may be null)
            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("id", updatedUser.getId());
            response.put("firstName", updatedUser.getFirstName());
            response.put("lastName", updatedUser.getLastName());
            response.put("name", updatedUser.getName());
            response.put("email", updatedUser.getEmail());
            response.put("picture", updatedUser.getPicture());
            response.put("role", updatedUser.getRole().name());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating profile for email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to update profile: " + e.getMessage()));
        }
    }

    // Google login endpoint - for direct Google token submission from React
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        log.info("Processing Google login request");
        try {
            String googleToken = request.get("token");
            if (googleToken == null || googleToken.isEmpty()) {
                log.warn("Google token is missing or empty");
                return ResponseEntity.badRequest().body(Map.of("message", "Google token is required"));
            }

            // Decode and extract claims from Google ID token
            Map<String, Object> claims = decodeGoogleToken(googleToken);
            String email = (String) claims.get("email");
            String name = (String) claims.get("name");
            String picture = (String) claims.get("picture");
            String googleId = (String) claims.get("sub");

            if (email == null || email.isEmpty()) {
                log.warn("Email not found in Google token");
                return ResponseEntity.badRequest().body(Map.of("message", "Email not found in Google token"));
            }

            log.debug("Google token decoded - Email: {}, GoogleId: {}", email, googleId);

            // Find existing user or create new one
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                log.info("Creating new user from Google login - Email: {}", email);
                String[] nameParts = name != null ? name.split(" ", 2) : new String[]{"", ""};
                User newUser = User.builder()
                        .email(email)
                        .firstName(nameParts.length > 0 ? nameParts[0] : "")
                        .lastName(nameParts.length > 1 ? nameParts[1] : "")
                        .name(name)
                        .picture(picture)
                        .googleId(googleId)
                        .role(Role.USER)
                        .build();
                return userRepository.save(newUser);
            });

            // Update user info
            user.setName(name);
            user.setPicture(picture);
            userRepository.save(user);

            // Generate JWT token
            String jwtToken = jwtUtils.generateToken(user.getEmail(), user.getRole().name());
            log.info("JWT token generated for Google login - Email: {}", email);

            return ResponseEntity.ok(Map.of("token", jwtToken, "user", Map.of(
                    "id", user.getId(),
                    "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                    "lastName", user.getLastName() != null ? user.getLastName() : "",
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name()
            )));
        } catch (Exception e) {
            log.error("Error processing Google login: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Google login failed: " + e.getMessage()));
        }
    }

    // Google register endpoint - for Google registration
    @PostMapping("/google-register")
    public ResponseEntity<?> googleRegister(@RequestBody Map<String, String> request) {
        log.info("Processing Google registration request");
        try {
            String googleToken = request.get("token");
            if (googleToken == null || googleToken.isEmpty()) {
                log.warn("Google token is missing or empty");
                return ResponseEntity.badRequest().body(Map.of("message", "Google token is required"));
            }

            Map<String, Object> claims = decodeGoogleToken(googleToken);
            String email = (String) claims.get("email");
            String name = (String) claims.get("name");
            String picture = (String) claims.get("picture");
            String googleId = (String) claims.get("sub");

            if (email == null || email.isEmpty()) {
                log.warn("Email not found in Google token");
                return ResponseEntity.badRequest().body(Map.of("message", "Email not found in Google token"));
            }

            log.debug("Google token decoded for registration - Email: {}", email);

            // Check if user already exists
            if (userRepository.findByEmail(email).isPresent()) {
                log.warn("User already exists with email: {}", email);
                return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
            }

            // Create new user
            String[] nameParts = name != null ? name.split(" ", 2) : new String[]{"", ""};
            User newUser = User.builder()
                    .email(email)
                    .firstName(nameParts.length > 0 ? nameParts[0] : "")
                    .lastName(nameParts.length > 1 ? nameParts[1] : "")
                    .name(name)
                    .picture(picture)
                    .googleId(googleId)
                    .role(Role.USER)
                    .build();
            User savedUser = userRepository.save(newUser);
            log.info("New user created via Google registration - Email: {}", email);

            // Generate JWT token
            String jwtToken = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole().name());

            return ResponseEntity.ok(Map.of("token", jwtToken, "user", Map.of(
                    "id", savedUser.getId(),
                    "firstName", savedUser.getFirstName() != null ? savedUser.getFirstName() : "",
                    "lastName", savedUser.getLastName() != null ? savedUser.getLastName() : "",
                    "email", savedUser.getEmail(),
                    "name", savedUser.getName(),
                    "role", savedUser.getRole().name()
            )));
        } catch (Exception e) {
            log.error("Error processing Google registration: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Google registration failed: " + e.getMessage()));
        }
    }

    // Email/password registration endpoint
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        log.info("Processing email/password registration request");
        try {
            String firstName = request.get("firstName");
            String lastName = request.get("lastName");
            String email = request.get("email");
            String password = request.get("password");

            // Validate input
            if (firstName == null || firstName.isEmpty() || email == null || email.isEmpty() 
                    || password == null || password.isEmpty()) {
                log.warn("Missing required registration fields");
                return ResponseEntity.badRequest().body(Map.of("message", "First name, email, and password are required"));
            }

            if (password.length() < 6) {
                log.warn("Password too short for email: {}", email);
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
            }

            // Check if email already exists
            if (userRepository.findByEmail(email).isPresent()) {
                log.warn("User already exists with email: {}", email);
                return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
            }

            // Hash password using BCryptPasswordEncoder
            String hashedPassword = passwordEncoder.encode(password);
            String fullName = firstName + (lastName != null && !lastName.isEmpty() ? " " + lastName : "");
            User newUser = User.builder()
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName != null ? lastName : "")
                    .name(fullName)
                    .password(hashedPassword)
                    .role(Role.USER)
                    .build();
            User savedUser = userRepository.save(newUser);
            log.info("New user created via email registration - Email: {}", email);

            return ResponseEntity.ok(Map.of("message", "Registration successful. Please login."));
        } catch (Exception e) {
            log.error("Error processing registration: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    // Email/password login endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        log.info("Processing email/password login request");
        try {
            String email = request.get("email");
            String password = request.get("password");

            // Validate input
            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                log.warn("Missing email or password");
                return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
            }

            // Find user by email
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        log.warn("User not found for email: {}", email);
                        return null;
                    });

            // Validate user exists and password matches
            if (user == null || user.getPassword() == null || 
                    !passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Failed login attempt for email: {}", email);
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password"));
            }

            // Generate JWT token
            String jwtToken = jwtUtils.generateToken(user.getEmail(), user.getRole().name());
            log.info("JWT token generated for email login - Email: {}", email);

            return ResponseEntity.ok(Map.of(
                    "token", jwtToken,
                    "user", Map.of(
                            "id", user.getId(),
                            "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                            "lastName", user.getLastName() != null ? user.getLastName() : "",
                            "email", user.getEmail(),
                            "name", user.getName(),
                            "role", user.getRole().name()
                    )
            ));
        } catch (Exception e) {
            log.error("Error processing login: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    // Helper method to decode Google ID token JWT payload
    private Map<String, Object> decodeGoogleToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token format");
            }
            
            // Decode the payload (middle part)
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            
            // Parse JSON payload
            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(payload);
            
            // Extract claims
            Map<String, Object> claims = new java.util.HashMap<>();
            jsonNode.fieldNames().forEachRemaining(fieldName -> {
                JsonNode fieldValue = jsonNode.get(fieldName);
                if (fieldValue.isTextual()) {
                    claims.put(fieldName, fieldValue.asText());
                } else {
                    claims.put(fieldName, fieldValue.asText());
                }
            });
            
            log.debug("Successfully decoded Google token");
            return claims;
        } catch (Exception e) {
            log.error("Error decoding Google token: {}", e.getMessage(), e);
            throw new RuntimeException("Could not decode Google token", e);
        }
    }
}