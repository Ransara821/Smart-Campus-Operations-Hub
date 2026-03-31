// src/main/java/com/smartcampus/security/JwtAuthFilter.java
package com.smartcampus.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtils jwtUtils;

    public JwtAuthFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        log.debug("Processing request: {} {}", request.getMethod(), requestPath);
        
        try {
            String header = request.getHeader("Authorization");

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                log.debug("Bearer token found in Authorization header");

                if (jwtUtils.validateToken(token)) {
                    try {
                        String email = jwtUtils.getEmailFromToken(token);
                        String role  = jwtUtils.getRoleFromToken(token);

                        // Prefix with ROLE_ so Spring Security @PreAuthorize("hasRole('ADMIN')") works
                        var auth = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        log.info("User authenticated successfully - Email: {}, Role: {}, Path: {}", email, role, requestPath);
                    } catch (Exception e) {
                        log.error("Error processing valid token: {}", e.getMessage(), e);
                    }
                } else {
                    log.warn("Invalid or expired JWT token provided, request: {} {}", request.getMethod(), requestPath);
                }
            } else if (header != null) {
                log.debug("Authorization header does not start with 'Bearer', path: {}", requestPath);
            } else {
                log.debug("No Authorization header found for path: {}", requestPath);
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("JWT filter exception for path {}: {}", requestPath, e.getMessage(), e);
            filterChain.doFilter(request, response);
        }
    }
}