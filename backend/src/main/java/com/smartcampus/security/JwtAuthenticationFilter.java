package com.smartcampus.security;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private final UserRepository userRepository;

  public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
    this.jwtUtil = jwtUtil;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String authHeader = request.getHeader("Authorization");
    String token = null;
    String email = null;

    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      if (jwtUtil.validateToken(token)) {
        email = jwtUtil.getEmailFromToken(token);
      }
    }

    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isPresent()) {
        User user = userOptional.get();

        // For compatibility with your controllers using @AuthenticationPrincipal
        // OAuth2User
        OAuth2User oauth2User = new DefaultOAuth2User(
            Collections.emptyList(),
            Map.of("email", user.getEmail(), "sub", user.getGoogleId() == null ? "" : user.getGoogleId()),
            "email");

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            oauth2User, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    }

    filterChain.doFilter(request, response);
  }
}
