package com.smartcampus.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.List;

@Component
public class DevBypassFilter extends OncePerRequestFilter {

    @Value("${app.dev-bypass.enabled:false}")
    private boolean devBypassEnabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!devBypassEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String devRole = request.getHeader("X-Dev-Role");
        if (devRole != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String roleName = devRole.toUpperCase();
            String email = "dev-" + roleName.toLowerCase() + "@smartcampus.local";

            // Create Mock OAuth2 User Context
            Map<String, Object> attributes = Map.of(
                    "sub", "dev-123",
                    "name", "Dev " + roleName,
                    "email", email,
                    "picture", "");

            List<GrantedAuthority> authorities = Collections
                    .singletonList(new SimpleGrantedAuthority("ROLE_" + roleName));
            OAuth2User mockUser = new DefaultOAuth2User(authorities, attributes, "email");

            Authentication auth = new OAuth2AuthenticationToken(mockUser, authorities, "google");
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
