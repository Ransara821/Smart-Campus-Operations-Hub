package com.smartcampus.controller;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtUtil;
import com.smartcampus.service.EmailService;
import com.smartcampus.service.OtpStore;
import com.smartcampus.service.PendingSignupStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
    private final OtpStore otpStore;
    private final PendingSignupStore pendingSignupStore;
    private final EmailService emailService;
    private final Set<String> adminEmails;
    private final Set<String> otpBypassEmails;

    public AuthController(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            OtpStore otpStore,
            PendingSignupStore pendingSignupStore,
            EmailService emailService,
            @Value("${app.admin.emails:admin@smartcampus.edu}") String adminEmailsConfig,
            @Value("${app.otp.bypass.emails:user@gmail.com,technician@gmail.com}") String otpBypassEmailsConfig) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpStore = otpStore;
        this.pendingSignupStore = pendingSignupStore;
        this.emailService = emailService;
        this.adminEmails = new HashSet<>();
        this.otpBypassEmails = new HashSet<>();
        Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .map(String::toLowerCase)
                .forEach(this.adminEmails::add);
        Arrays.stream(otpBypassEmailsConfig.split(","))
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .map(String::toLowerCase)
                .forEach(this.otpBypassEmails::add);
    }

    // ─── GET /api/auth/me ─────────────────────────────────────────────────────

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

    // ─── SIGNUP STEP 1: validate + send OTP ──────────────────────────────────

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (isBlank(request.email()) || isBlank(request.password()) || isBlank(request.name())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email and password are required"));
        }

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "An account with this email already exists"));
        }

        pendingSignupStore.save(
                normalizedEmail,
                request.name().trim(),
                passwordEncoder.encode(request.password()),
                resolveInitialRole(normalizedEmail, request.role()));

        String otp = otpStore.generateOtp(normalizedEmail);
        try {
            emailService.sendOtpEmail(normalizedEmail, otp);
        } catch (Exception e) {
            e.printStackTrace(); // Log the actual error
            otpStore.clearOtp(normalizedEmail);
            pendingSignupStore.clear(normalizedEmail);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send OTP email. Please try again."));
        }

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent to " + normalizedEmail,
                "email", normalizedEmail,
                "step", "otp_required"
        ));
    }

    // ─── SIGNUP STEP 2: verify OTP → return JWT ───────────────────────────────

    @PostMapping("/signup/verify-otp")
    public ResponseEntity<?> verifySignupOtp(@RequestBody OtpVerifyRequest request) {
        if (isBlank(request.email()) || isBlank(request.otp())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        String normalizedEmail = normalizeEmail(request.email());
        PendingSignupStore.PendingSignup pendingSignup = pendingSignupStore.get(normalizedEmail);
        if (pendingSignup == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Signup session expired. Please sign up again."));
        }

        if (!otpStore.validateOtp(normalizedEmail, request.otp())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP. Please try again."));
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            pendingSignupStore.clear(normalizedEmail);
            return ResponseEntity.status(409).body(Map.of("message", "An account with this email already exists"));
        }

        User savedUser = userRepository.save(User.builder()
                .email(pendingSignup.email())
                .name(pendingSignup.name())
                .role(pendingSignup.role())
                .passwordHash(pendingSignup.passwordHash())
                .build());
        pendingSignupStore.clear(normalizedEmail);
        String token = jwtUtil.generateToken(savedUser);
        return ResponseEntity.ok(AuthResponse.from(savedUser, token));
    }

    // ─── SIGNIN STEP 1: validate credentials + send OTP ──────────────────────

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

        // Enforce admin access only to configured admin emails
        if (user.getRole() == Role.ADMIN && !isAdminEmail(normalizedEmail)) {
            user.setRole(Role.USER);
            user = userRepository.save(user);
        }

        if (user.getRole() == Role.ADMIN && isAdminEmail(normalizedEmail)) {
            otpStore.clearOtp(normalizedEmail);
            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(AuthResponse.from(user, token));
        }

        // Allow configured support users to sign in directly without OTP.
        if (isOtpBypassEmail(normalizedEmail)) {
            otpStore.clearOtp(normalizedEmail);
            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(AuthResponse.from(user, token));
        }

        // Generate and email OTP — recipient is request.email() (the user's own address)
        String otp = otpStore.generateOtp(normalizedEmail);
        try {
            emailService.sendOtpEmail(normalizedEmail, otp);
        } catch (Exception e) {
            e.printStackTrace(); // Log the actual error
            otpStore.clearOtp(normalizedEmail);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send OTP email. Please try again."));
        }

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent to " + normalizedEmail,
                "email", normalizedEmail,
                "step", "otp_required"
        ));
    }

    // ─── SIGNIN STEP 2: verify OTP → return JWT ───────────────────────────────

    @PostMapping("/signin/verify-otp")
    public ResponseEntity<?> verifySigninOtp(@RequestBody OtpVerifyRequest request) {
        if (isBlank(request.email()) || isBlank(request.otp())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        String normalizedEmail = normalizeEmail(request.email());

        if (!otpStore.validateOtp(normalizedEmail, request.otp())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP. Please try again."));
        }

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();

        // Re-enforce admin role check on final step too
        if (user.getRole() == Role.ADMIN && !isAdminEmail(normalizedEmail)) {
            user.setRole(Role.USER);
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(AuthResponse.from(user, token));
    }

    // ─── RESEND OTP ───────────────────────────────────────────────────────────

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String mode = request.getOrDefault("mode", "signin"); // "signin" or "signup"

        if (isBlank(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        String normalizedEmail = normalizeEmail(email);
        String normalizedMode = mode == null ? "signin" : mode.trim().toLowerCase();

        if ("signin".equals(normalizedMode) && userRepository.findByEmail(normalizedEmail).isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found."));
        }
        if ("signup".equals(normalizedMode) && pendingSignupStore.get(normalizedEmail) == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Signup session expired. Please sign up again."));
        }

        String otp = otpStore.generateOtp(normalizedEmail);
        try {
            emailService.sendOtpEmail(normalizedEmail, otp);
        } catch (Exception e) {
            e.printStackTrace(); // Log the actual error
            otpStore.clearOtp(normalizedEmail);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to resend OTP. Please try again."));
        }

        return ResponseEntity.ok(Map.of(
                "message", "OTP resent to " + normalizedEmail,
                "email", normalizedEmail,
                "step", "otp_required"
        ));
    }

    // ─── ROLE SELECTION ───────────────────────────────────────────────────────

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
            String newToken = jwtUtil.generateToken(saved);
            return ResponseEntity.ok(Map.of("user", saved, "token", newToken));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
    }

    // ─── LOGOUT ───────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request) {
        try {
            request.getSession().invalidate();
            return ResponseEntity.ok().body(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of("message", "Logout completed"));
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

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

    private boolean isOtpBypassEmail(String email) {
        return otpBypassEmails.contains(normalizeEmail(email));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    // ─── Request / Response Records ───────────────────────────────────────────

    public record SignupRequest(String name, String email, String password, String role) {}

    public record SigninRequest(String email, String password) {}

    public record OtpVerifyRequest(String email, String otp) {}

    public record AuthResponse(String token, User user) {
        static AuthResponse from(User user, String token) {
            return new AuthResponse(token, user);
        }
    }
}
