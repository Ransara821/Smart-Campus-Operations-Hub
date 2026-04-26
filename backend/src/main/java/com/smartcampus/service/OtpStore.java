package com.smartcampus.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory store for OTP codes.
 * Each entry maps an email → { otp, expiry }.
 * OTPs expire after 10 minutes.
 */
@Component
public class OtpStore {

    private static final long OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

    private record OtpEntry(String otp, Instant expiry) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Generates a new 6-digit OTP for the given email, stores it, and returns it.
     * Overwrites any existing OTP for that email.
     */
    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        store.put(normalizeEmail(email), new OtpEntry(otp, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS)));
        return otp;
    }

    /**
     * Validates the OTP for the given email.
     * Returns true if the OTP matches and has not expired.
     * Removes the OTP entry after a successful validation (one-time use).
     */
    public boolean validateOtp(String email, String otp) {
        String key = normalizeEmail(email);
        OtpEntry entry = store.get(key);
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiry())) {
            store.remove(key);
            return false;
        }
        if (entry.otp().equals(otp)) {
            store.remove(key); // one-time use
            return true;
        }
        return false;
    }

    /** Removes any pending OTP for the given email. */
    public void clearOtp(String email) {
        store.remove(normalizeEmail(email));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
