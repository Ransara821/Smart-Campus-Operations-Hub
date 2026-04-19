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

import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

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

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();
            existingUser.setName(name);
            existingUser.setAvatarUrl(picture);
            existingUser.setRole(isAdminEmail(email) ? Role.ADMIN : existingUser.getRole());
            // Updating existing user
            userRepository.save(existingUser);
        } else {
            // Registering a new user via OAuth
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .googleId(googleId)
                    .avatarUrl(picture)
                    .role(isAdminEmail(email) ? Role.ADMIN : Role.USER)
                    .build();
            userRepository.save(newUser);
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
