package com.smartcampus.security;

import com.smartcampus.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JwtUtil {

  private static final String HMAC_ALGORITHM = "HmacSHA256";

  private final byte[] secretBytes;
  private final long jwtExpirationMs;

  public JwtUtil(@Value("${jwt.secret}") String secret,
      @Value("${jwt.expirationMs}") long jwtExpirationMs) {
    this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    this.jwtExpirationMs = jwtExpirationMs;
  }

  public String generateToken(User user) {
    try {
      long nowSeconds = System.currentTimeMillis() / 1000;
      long expSeconds = nowSeconds + (jwtExpirationMs / 1000);

      String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
      String payloadJson = "{"
          + "\"sub\":\"" + escapeJson(user.getEmail()) + "\","
          + "\"id\":\"" + escapeJson(user.getId()) + "\","
          + "\"role\":\"" + escapeJson(user.getRole().name()) + "\","
          + "\"iat\":" + nowSeconds + ","
          + "\"exp\":" + expSeconds
          + "}";

      String headerEncoded = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));
      String payloadEncoded = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));
      String signingInput = headerEncoded + "." + payloadEncoded;
      String signature = base64UrlEncode(hmacSha256(signingInput));

      return signingInput + "." + signature;
    } catch (Exception e) {
      throw new IllegalStateException("Failed to generate JWT token", e);
    }
  }

  public String getEmailFromToken(String token) {
    try {
      String payloadJson = decodePayloadJson(token);
      return extractStringClaim(payloadJson, "sub");
    } catch (Exception e) {
      return null;
    }
  }

  public boolean validateToken(String authToken) {
    try {
      String[] parts = authToken.split("\\.");
      if (parts.length != 3) {
        return false;
      }

      String signingInput = parts[0] + "." + parts[1];
      String expectedSig = base64UrlEncode(hmacSha256(signingInput));
      if (!MessageDigest.isEqual(expectedSig.getBytes(StandardCharsets.UTF_8),
          parts[2].getBytes(StandardCharsets.UTF_8))) {
        return false;
      }

      String payloadJson = decodePayloadJson(authToken);
      Long exp = extractLongClaim(payloadJson, "exp");
      if (exp == null) {
        return false;
      }

      long nowSeconds = new Date().getTime() / 1000;
      return exp > nowSeconds;
    } catch (Exception e) {
      System.err.println("Invalid JWT token: " + e.getMessage());
    }
    return false;
  }

  private String decodePayloadJson(String token) {
    String[] parts = token.split("\\.");
    if (parts.length != 3) {
      throw new IllegalArgumentException("Malformed token");
    }

    byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
    return new String(payloadBytes, StandardCharsets.UTF_8);
  }

  private byte[] hmacSha256(String data) throws Exception {
    Mac mac = Mac.getInstance(HMAC_ALGORITHM);
    mac.init(new SecretKeySpec(secretBytes, HMAC_ALGORITHM));
    return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
  }

  private String base64UrlEncode(byte[] bytes) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String escapeJson(String input) {
    if (input == null) {
      return "";
    }
    return input.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  private String extractStringClaim(String json, String claimName) {
    String pattern = "\\\"" + Pattern.quote(claimName) + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"";
    Matcher matcher = Pattern.compile(pattern).matcher(json);
    return matcher.find() ? matcher.group(1) : null;
  }

  private Long extractLongClaim(String json, String claimName) {
    String pattern = "\\\"" + Pattern.quote(claimName) + "\\\"\\s*:\\s*(\\d+)";
    Matcher matcher = Pattern.compile(pattern).matcher(json);
    if (!matcher.find()) {
      return null;
    }
    return Long.parseLong(matcher.group(1));
  }
}
