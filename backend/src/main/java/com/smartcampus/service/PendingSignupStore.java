package com.smartcampus.service;

import com.smartcampus.model.Role;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PendingSignupStore {

    private static final long EXPIRY_SECONDS = 10 * 60;

    public record PendingSignup(String email, String name, String passwordHash, Role role, Instant expiry) {}

    private final Map<String, PendingSignup> store = new ConcurrentHashMap<>();

    public void save(String email, String name, String passwordHash, Role role) {
        String normalizedEmail = normalizeEmail(email);
        store.put(normalizedEmail, new PendingSignup(
                normalizedEmail,
                name,
                passwordHash,
                role,
                Instant.now().plusSeconds(EXPIRY_SECONDS)
        ));
    }

    public PendingSignup get(String email) {
        String normalizedEmail = normalizeEmail(email);
        PendingSignup pendingSignup = store.get(normalizedEmail);
        if (pendingSignup == null) {
            return null;
        }
        if (Instant.now().isAfter(pendingSignup.expiry())) {
            store.remove(normalizedEmail);
            return null;
        }
        return pendingSignup;
    }

    public void clear(String email) {
        store.remove(normalizeEmail(email));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
