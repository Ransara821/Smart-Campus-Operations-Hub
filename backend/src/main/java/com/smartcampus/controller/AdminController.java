// src/main/java/com/smartcampus/controller/AdminController.java
package com.smartcampus.controller;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        log.debug("Fetching all users - Admin request");
        try {
            List<User> users = userRepository.findAll();
            log.info("Successfully retrieved {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching all users", e);
            throw e;
        }
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestParam Role role) {
        log.info("Admin attempting to update role for user: {} to role: {}", id, role);
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> {
                        log.warn("User not found for ID: {}", id);
                        return new RuntimeException("User not found");
                    });
            user.setRole(role);
            userRepository.save(user);
            log.info("Successfully updated user {} role to {}", id, role);
            return ResponseEntity.ok(Map.of(
                    "message", "Role updated to " + role,
                    "user", Map.of(
                            "id", user.getId(),
                            "name", user.getName(),
                            "email", user.getEmail(),
                            "role", user.getRole().name()
                    )
            ));
        } catch (Exception e) {
            log.error("Error updating role for user {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        log.info("Admin attempting to delete user: {}", id);
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> {
                        log.warn("User not found for ID: {}", id);
                        return new RuntimeException("User not found");
                    });
            
            String userName = user.getName();
            userRepository.deleteById(id);
            log.info("Successfully deleted user {} ({})", id, userName);
            return ResponseEntity.ok(Map.of(
                    "message", "User deleted successfully",
                    "deletedUser", Map.of(
                            "id", id,
                            "name", userName,
                            "email", user.getEmail()
                    )
            ));
        } catch (Exception e) {
            log.error("Error deleting user {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> request) {
        log.info("Admin attempting to create a new user");
        try {
            String email = request.get("email");
            String name = request.get("name");
            String roleStr = request.get("role");

            // Validate input
            if (email == null || email.isEmpty() || name == null || name.isEmpty()) {
                log.warn("Missing required fields for user creation");
                return ResponseEntity.badRequest().body(Map.of("message", "Email and name are required"));
            }

            // Check if email already exists
            if (userRepository.findByEmail(email).isPresent()) {
                log.warn("User already exists with email: {}", email);
                return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
            }

            // Determine role (default to USER if not specified)
            Role role = Role.USER;
            if (roleStr != null && !roleStr.isEmpty()) {
                try {
                    role = Role.valueOf(roleStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid role specified: {}", roleStr);
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid role: " + roleStr));
                }
            }

            // Create new user
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .role(role)
                    .build();
            User savedUser = userRepository.save(newUser);
            log.info("Successfully created new user - Email: {}, Role: {}", email, role);

            return ResponseEntity.ok(Map.of(
                    "message", "User created successfully",
                    "user", Map.of(
                            "id", savedUser.getId(),
                            "name", savedUser.getName(),
                            "email", savedUser.getEmail(),
                            "role", savedUser.getRole().name()
                    )
            ));
        } catch (Exception e) {
            log.error("Error creating user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "User creation failed: " + e.getMessage()));
        }
    }
}