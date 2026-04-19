package com.smartcampus.security;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private final JwtUtil jwtUtil;
  private final UserRepository userRepository;

  @Value("${oauth.success-url}")
  private String frontendSuccessUrl;

  public OAuth2LoginSuccessHandler(JwtUtil jwtUtil, UserRepository userRepository) {
    this.jwtUtil = jwtUtil;
    this.userRepository = userRepository;
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
    String email = oAuth2User.getAttribute("email");

    // The CustomOAuth2UserService already saved the user, we just fetch them
    Optional<User> userOpt = userRepository.findByEmail(email);

    if (userOpt.isPresent()) {
      User user = userOpt.get();
      // Generate the secure JWT Token
      String token = jwtUtil.generateToken(user);

      // Redirect to frontend with the token in the URL so React can pick it up
      // Example: http://localhost:5173/select-role?token=eyJhbGciOiJIUz...
      String redirectUrl = frontendSuccessUrl + "?token=" + token;
      getRedirectStrategy().sendRedirect(request, response, redirectUrl);

    } else {
      // Fallback if user somehow wasn't created
      getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=true");
    }
  }
}
