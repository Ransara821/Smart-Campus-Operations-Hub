// src/main/java/com/smartcampus/security/OAuth2SuccessHandler.java
package com.smartcampus.security;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
    }

    // React app URL — change if your frontend runs on a different port
    private static final String FRONTEND_URL = "http://localhost:3000/oauth2/callback";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        log.info("OAuth2 authentication successful");
        
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            String email    = oAuth2User.getAttribute("email");
            String name     = oAuth2User.getAttribute("name");
            String picture  = oAuth2User.getAttribute("picture");
            String googleId = oAuth2User.getAttribute("sub");

            log.debug("Processing OAuth2 user - Email: {}, GoogleId: {}", email, googleId);

            // Find existing user or create new one with role USER
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                log.info("Creating new user from OAuth2 - Email: {}, Name: {}", email, name);
                User newUser = User.builder()
                        .email(email)
                        .name(name)
                        .picture(picture)
                        .googleId(googleId)
                        .role(Role.USER)      // default role
                        .build();
                User saved = userRepository.save(newUser);
                log.info("New user successfully created - Email: {}, ID: {}", email, saved.getId());
                return saved;
            });

            // Update name/picture on every login in case they changed
            log.debug("Updating user information - Email: {}", email);
            user.setName(name);
            user.setPicture(picture);
            userRepository.save(user);
            log.debug("User information updated - Email: {}, Role: {}", email, user.getRole().name());

            // Generate JWT
            String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());
            log.debug("JWT token generated for OAuth2 user: {}", email);

            // Redirect to React with token as query param
            String redirectUrl = UriComponentsBuilder.fromUriString(FRONTEND_URL)
                    .queryParam("token", token)
                    .build().toUriString();

            log.info("Redirecting OAuth2 user to frontend - Email: {}", email);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception e) {
            log.error("Error during OAuth2 authentication success handler: {}", e.getMessage(), e);
            throw e;
        }
    }
}