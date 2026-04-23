package com.smartcampus.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication(scanBasePackages = "com.smartcampus")
@EnableMongoRepositories(basePackages = "com.smartcampus.repository")
public class SmartCampusBackendApplication {

	public static void main(String[] args) {
		// Load .env file. ignoreIfMissing() keeps this safe in CI/CD.
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();
		dotenv.entries().forEach(e -> {
			System.setProperty(e.getKey(), e.getValue());
			if ("MONGODB_URI".equals(e.getKey())) {
				System.setProperty("spring.data.mongodb.uri", e.getValue());
			}
		});

		// Build a map of Spring properties from dotenv values.
		// SpringApplicationBuilder.properties() injects at highest priority,
		// overriding anything in application.properties.
		Map<String, Object> springProps = new HashMap<>();

		String mongoUri = dotenv.get("MONGODB_URI", null);
		if (mongoUri != null && !mongoUri.isBlank()) {
			springProps.put("spring.data.mongodb.uri", mongoUri);
			System.out.println("=== Using Atlas MongoDB URI from .env ===");
		}

		String frontendUrl = dotenv.get("FRONTEND_URL", "http://localhost:5173");
		springProps.put("app.frontend-url", frontendUrl);

		String baseUrl = dotenv.get("BASE_URL", "http://localhost:8082");
		springProps.put("app.base-url", baseUrl);

		String jwtSecret = dotenv.get("JWT_SECRET", null);
		if (jwtSecret != null) springProps.put("jwt.secret", jwtSecret);

		String oauthRedirect = dotenv.get("OAUTH_REDIRECT_URI", null);
		if (oauthRedirect != null)
			springProps.put("spring.security.oauth2.client.registration.google.redirect-uri", oauthRedirect);

		String oauthSuccess = dotenv.get("OAUTH_SUCCESS_URL", null);
		if (oauthSuccess != null) springProps.put("oauth.success-url", oauthSuccess);

		String mailUsername = dotenv.get("MAIL_USERNAME", null);
		if (mailUsername != null) {
			springProps.put("spring.mail.username", mailUsername);
			System.out.println("=== MAIL_USERNAME loaded: " + mailUsername + " ===");
		}

		String mailPassword = dotenv.get("MAIL_PASSWORD", null);
		if (mailPassword != null) {
			springProps.put("spring.mail.password", mailPassword);
			System.out.println("=== MAIL_PASSWORD loaded (length: " + mailPassword.length() + ") ===");
		}

		new SpringApplicationBuilder(SmartCampusBackendApplication.class)
				.properties(springProps)
				.run(args);
	}

}
