package com.smartcampus.controller;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final Set<String> adminEmails;

    public AuthController(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            @Value("${app.admin.emails:admin@smartcampus.edu}") String adminEmailsConfig) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.adminEmails = new HashSet<>();
        Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .map(String::toLowerCase)
                .forEach(this.adminEmails::add);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }

        String email = null;
        Object principal = authentication.getPrincipal();

        if (principal instanceof OAuth2User oauth2User) {
            email = oauth2User.getAttribute("email");
        } else if (principal instanceof String principalName) {
            email = principalName;
        }

        if (email == null) {
            return ResponseEntity.status(401).build();
        }

        Optional<User> user = userRepository.findByEmail(normalizeEmail(email));
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).build());
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (isBlank(request.email()) || isBlank(request.password()) || isBlank(request.name())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email and password are required"));
        }

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "An account with this email already exists"));
        }

        User newUser = User.builder()
                .email(normalizedEmail)
                .name(request.name().trim())
                .role(resolveInitialRole(normalizedEmail, request.role()))
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        User saved = userRepository.save(newUser);
        String token = jwtUtil.generateToken(saved);
        return ResponseEntity.ok(AuthResponse.from(saved, token));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody SigninRequest request) {
        if (isBlank(request.email()) || isBlank(request.password())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        String normalizedEmail = normalizeEmail(request.email());
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        User user = userOpt.get();
        if (isBlank(user.getPasswordHash()) || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        // Enforce admin access only to configured admin emails.
        if (user.getRole() == Role.ADMIN && !isAdminEmail(normalizedEmail)) {
            user.setRole(Role.USER);
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(AuthResponse.from(user, token));
    }

    @PostMapping("/select-role")
    public ResponseEntity<?> selectRole(Authentication authentication,
            @RequestBody Map<String, String> request) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated. Please log in first."));
        }

        String email = null;
        Object principal = authentication.getPrincipal();

        if (principal instanceof OAuth2User oauth2User) {
            email = oauth2User.getAttribute("email");
        } else if (principal instanceof String principalName) {
            email = principalName;
        }

        String roleName = request.get("role");

        if (email == null || roleName == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and role are required"));
        }

        email = normalizeEmail(email);

        Role role;
        try {
            role = Role.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role: " + roleName));
        }

        if (role == Role.ADMIN && !isAdminEmail(email)) {
            return ResponseEntity.status(403).body(Map.of("message", "Admin role is restricted to approved admin emails"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(role);
            User saved = userRepository.save(user);
            // Return fresh JWT so frontend can update its token with the new role
            String newToken = jwtUtil.generateToken(saved);
            return ResponseEntity.ok(Map.of("user", saved, "token", newToken));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request) {
        try {
            request.getSession().invalidate();
            return ResponseEntity.ok().body(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of("message", "Logout completed"));
        }
    }

    private Role resolveInitialRole(String email, String requestedRole) {
        if (isAdminEmail(email)) {
            return Role.ADMIN;
        }
        if (requestedRole == null || requestedRole.isBlank()) {
            return Role.USER;
        }
        try {
            Role role = Role.valueOf(requestedRole.trim().toUpperCase());
            return role == Role.ADMIN ? Role.USER : role;
        } catch (IllegalArgumentException ex) {
            return Role.USER;
        }
    }

    private boolean isAdminEmail(String email) {
        return adminEmails.contains(normalizeEmail(email));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public record SignupRequest(String name, String email, String password, String role) {
    }

    public record SigninRequest(String email, String password) {
    }

    public record AuthResponse(String token, User user) {
        static AuthResponse from(User user, String token) {
            return new AuthResponse(token, user);
        }
    }

}
