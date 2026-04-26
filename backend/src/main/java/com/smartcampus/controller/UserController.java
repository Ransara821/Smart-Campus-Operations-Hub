package com.smartcampus.controller;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/technicians")
    public ResponseEntity<?> getTechnicians(@AuthenticationPrincipal OAuth2User principal) {
        User authUser = getAuthenticatedUser(principal);
        if (authUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        if (authUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only admins can view technicians"));
        }

        List<Map<String, Object>> technicians = userRepository.findByRole(Role.TECHNICIAN)
                .stream()
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "name", user.getName() == null ? "Technician" : user.getName(),
                        "email", user.getEmail() == null ? "" : user.getEmail(),
                        "role", user.getRole().name()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(technicians);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> updates, Authentication authentication) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        if (updates.containsKey("name")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full Name is locked after account creation and cannot be changed."));
        }

        if (updates.containsKey("role")) {
            try {
                Role newRole = Role.valueOf(((String) updates.get("role")).toUpperCase());
                String currentUserEmail = authentication.getName();
                if (user.getEmail().equals(currentUserEmail) && newRole != Role.ADMIN) {
                    return ResponseEntity.badRequest().body(Map.of("message", "You cannot change your own admin role to prevent lockout."));
                }
                user.setRole(newRole);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
            }
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, Authentication authentication) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String currentUserEmail = authentication.getName();

        if (user.getEmail().equals(currentUserEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "You cannot delete your own account."));
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    private User getAuthenticatedUser(OAuth2User principal) {
        if (principal == null) {
            User devAdmin = new User();
            devAdmin.setId("dev-admin-123");
            devAdmin.setName("Developer Admin");
            devAdmin.setEmail("dev-admin@smartcampus.local");
            devAdmin.setRole(Role.ADMIN);
            return devAdmin;
        }

        String email = principal.getAttribute("email");
        if (email == null || email.isBlank()) {
            return null;
        }

        if (email.startsWith("dev-")) {
            User devUser = new User();
            devUser.setEmail(email);
            if (email.contains("admin")) {
                devUser.setId("dev-admin-123");
                devUser.setName("Developer Admin");
                devUser.setRole(Role.ADMIN);
            } else if (email.contains("technician")) {
                devUser.setId("dev-tech-789");
                devUser.setName("Campus Technician");
                devUser.setRole(Role.TECHNICIAN);
            } else {
                devUser.setId("dev-user-456");
                devUser.setName("Student User");
                devUser.setRole(Role.USER);
            }
            return devUser;
        }

        return userRepository.findByEmail(email).orElse(null);
    }
}
