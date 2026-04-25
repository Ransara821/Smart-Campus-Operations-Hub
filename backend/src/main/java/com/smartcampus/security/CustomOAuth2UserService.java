package com.smartcampus.security;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserRepository userRepository;
    private final Set<String> adminEmails;

    public CustomOAuth2UserService(UserRepository userRepository,
            @Value("${app.admin.emails:admin@smartcampus.edu}") String adminEmailsConfig) {
        this.userRepository = userRepository;
        this.adminEmails = new HashSet<>();
        Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .map(String::toLowerCase)
                .forEach(this.adminEmails::add);
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = normalizeEmail(oAuth2User.getAttribute("email"));
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");
        String picture = oAuth2User.getAttribute("picture");

        log.info("=== CustomOAuth2UserService: Google user data ===");
        log.info("Email (normalized): {}, Name: {}, GoogleId: {}", email, name, googleId);

        if (email == null || email.isBlank()) {
            log.error("Google did not return an email - cannot save user!");
            throw new OAuth2AuthenticationException("no_email");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();
            log.info("Existing user found: {}, role: {}", existingUser.getEmail(), existingUser.getRole());
            existingUser.setAvatarUrl(picture);
            existingUser.setRole(isAdminEmail(email) ? Role.ADMIN : existingUser.getRole());
            userRepository.save(existingUser);
            log.info("Existing user updated in MongoDB");
        } else {
            log.info("New user - creating account for: {}", email);
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .googleId(googleId)
                    .avatarUrl(picture)
                    .role(isAdminEmail(email) ? Role.ADMIN : Role.USER)
                    .build();
            userRepository.save(newUser);
            log.info("New user saved to MongoDB with role: {}", newUser.getRole());
        }

        return oAuth2User;
    }

    private boolean isAdminEmail(String email) {
        return adminEmails.contains(normalizeEmail(email));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
