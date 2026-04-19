package com.smartcampus.security;

import com.smartcampus.model.Role;
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
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

  private final JwtUtil jwtUtil;
  private final UserRepository userRepository;
  private final Set<String> adminEmails;

  @Value("${oauth.success-url:http://localhost:5173/select-role}")
  private String frontendSelectRoleUrl;

  @Value("${app.frontend-url:http://localhost:5173}")
  private String frontendBaseUrl;

  public OAuth2LoginSuccessHandler(JwtUtil jwtUtil, UserRepository userRepository,
      @Value("${app.admin.emails:admin@smartcampus.edu}") String adminEmailsConfig) {
    this.jwtUtil = jwtUtil;
    this.userRepository = userRepository;
    this.adminEmails = new HashSet<>();
    Arrays.stream(adminEmailsConfig.split(","))
        .map(String::trim)
        .filter(e -> !e.isBlank())
        .map(String::toLowerCase)
        .forEach(this.adminEmails::add);
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

    String rawEmail = oAuth2User.getAttribute("email");
    String name = oAuth2User.getAttribute("name");
    String googleId = oAuth2User.getAttribute("sub");
    String picture = oAuth2User.getAttribute("picture");

    if (rawEmail == null || rawEmail.isBlank()) {
      log.error("Google did not return an email. Aborting.");
      getRedirectStrategy().sendRedirect(request, response, frontendBaseUrl + "/login?error=no_email");
      return;
    }

    String email = rawEmail.trim().toLowerCase();
    Optional<User> userOpt = userRepository.findByEmail(email);

    String token;
    boolean isNewUser;

    if (userOpt.isPresent()) {
      // --- EXISTING USER ---
      User user = userOpt.get();
      user.setName(name);
      user.setAvatarUrl(picture);
      if (user.getGoogleId() == null && googleId != null) {
        user.setGoogleId(googleId);
      }
      if (isAdminEmail(email)) {
        user.setRole(Role.ADMIN);
      }
      userRepository.save(user);
      token = jwtUtil.generateToken(user);
      isNewUser = false;
      log.info("Existing user logged in: {}, role: {}", email, user.getRole());
    } else {
      // --- NEW USER ---
      Role assignedRole = isAdminEmail(email) ? Role.ADMIN : Role.USER;
      User newUser = User.builder()
          .email(email)
          .name(name)
          .googleId(googleId)
          .avatarUrl(picture)
          .role(assignedRole)
          .build();
      userRepository.save(newUser);
      token = jwtUtil.generateToken(newUser);
      isNewUser = true;
      log.info("New user created: {}, role: {}", email, assignedRole);
    }

    // New users → role selection page
    // Existing users with role → go directly to dashboard (no flashing!)
    String redirectUrl;
    if (isNewUser) {
      redirectUrl = frontendSelectRoleUrl + "?token=" + token + "&new=true";
    } else {
      redirectUrl = frontendBaseUrl + "/resources?token=" + token;
    }

    log.info("Redirecting {} user {} to: {}", isNewUser ? "new" : "existing",
        email, redirectUrl.replace(token, "***"));
    getRedirectStrategy().sendRedirect(request, response, redirectUrl);
  }

  private boolean isAdminEmail(String email) {
    return adminEmails.contains(email);
  }
}
