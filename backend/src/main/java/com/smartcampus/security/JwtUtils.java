// src/main/java/com/smartcampus/security/JwtUtils.java
package com.smartcampus.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String email, String role) {
        try {
            log.debug("Generating JWT token for email: {}, role: {}", email, role);
            String token = Jwts.builder()
                    .setSubject(email)
                    .claim("role", role)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                    .signWith(key(), SignatureAlgorithm.HS256)
                    .compact();
            log.info("JWT token successfully generated for user: {}", email);
            return token;
        } catch (Exception e) {
            log.error("Error generating JWT token for email {}: {}", email, e.getMessage(), e);
            throw e;
        }
    }

    public String getEmailFromToken(String token) {
        try {
            String email = Jwts.parserBuilder().setSigningKey(key()).build()
                    .parseClaimsJws(token).getBody().getSubject();
            log.debug("Successfully extracted email from token");
            return email;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Error extracting email from token: {}", e.getMessage());
            throw e;
        }
    }

    public String getRoleFromToken(String token) {
        try {
            String role = (String) Jwts.parserBuilder().setSigningKey(key()).build()
                    .parseClaimsJws(token).getBody().get("role");
            log.debug("Successfully extracted role from token: {}", role);
            return role;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Error extracting role from token: {}", e.getMessage());
            throw e;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
            log.debug("JWT token validation successful");
            return true;
        } catch (SecurityException e) {
            log.warn("JWT signature validation failed: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.warn("Invalid JWT format: {}", e.getMessage());
            return false;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token has expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            log.warn("JWT token is not supported: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("JWT validation error: {}", e.getMessage());
            return false;
        }
    }
}