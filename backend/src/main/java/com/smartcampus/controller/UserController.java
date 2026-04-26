package com.smartcampus.controller;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    public ResponseEntity<List<User>> getAllTechnicians() {
        return ResponseEntity.ok(userRepository.findByRole(Role.TECHNICIAN));
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
                // Prevent self-demotion to avoid lockout if they are the only admin
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
}
