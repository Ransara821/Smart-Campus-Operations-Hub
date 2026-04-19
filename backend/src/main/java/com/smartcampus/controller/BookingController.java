package com.smartcampus.controller;
//REST endpoints for Booking module
import com.smartcampus.model.Attendance;
import com.smartcampus.model.Booking;
import com.smartcampus.model.User;
import com.smartcampus.repository.AttendanceRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository, AttendanceRepository attendanceRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
    }

    private User getAuthenticatedUser(OAuth2User principal) {
        if (principal == null) {
            // Dev mode: Return a default admin user
            // In production, this would throw 401
            User devUser = new User();
            devUser.setId("dev-admin-123");
            devUser.setName("Developer Admin");
            devUser.setEmail("dev-admin@smartcampus.local");
            devUser.setRole(com.smartcampus.model.Role.ADMIN);
            return devUser;
        }
        String email = principal.getAttribute("email");
        
        // Handle dev users that don't exist in database
        if (email != null && email.startsWith("dev-")) {
            User devUser = new User();
            devUser.setEmail(email);
            
            if (email.contains("admin")) {
                devUser.setId("dev-admin-123");
                devUser.setName("Developer Admin");
                devUser.setRole(com.smartcampus.model.Role.ADMIN);
            } else if (email.contains("user")) {
                devUser.setId("dev-user-456");
                devUser.setName("Student User");
                devUser.setRole(com.smartcampus.model.Role.USER);
            } else if (email.contains("technician")) {
                devUser.setId("dev-tech-789");
                devUser.setName("Campus Technician");
                devUser.setRole(com.smartcampus.model.Role.TECHNICIAN);
            } else {
                devUser.setId("dev-123");
                devUser.setName("Dev User");
                devUser.setRole(com.smartcampus.model.Role.USER);
            }
            return devUser;
        }
        
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(@AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();
        // Only ADMIN can view all bookings
        if (user.getRole() != com.smartcampus.model.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        List<Booking> bookings = bookingService.getAllBookings();
        System.out.println("📋 Fetching all bookings: " + bookings.size() + " found");
        for (Booking b : bookings) {
            String qrStatus = (b.getQrValidationData() != null && !b.getQrValidationData().isEmpty()) ? "✓ (" + b.getQrValidationData() + ")" : "✗ (null)";
            System.out.println("  - Booking " + b.getId() + ": status=" + b.getStatus() + ", qrData=" + qrStatus);
        }
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<?> getMyBookings(@AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();
        
        List<Booking> bookings = bookingService.getUserBookings(user.getId());
        System.out.println("📋 Fetching bookings for user " + user.getName() + ": " + bookings.size() + " found");
        for (Booking b : bookings) {
            System.out.println("  - Booking " + b.getId() + ": status=" + b.getStatus() + ", qrData=" + (b.getQrValidationData() != null ? "✓" : "✗"));
        }
        return ResponseEntity.ok(bookings);
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        booking.setUserId(user.getId());
        booking.setUserName(user.getName());

        try {
            Booking created = bookingService.createBooking(booking);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable String id,
                                            @RequestBody Map<String, String> body,
                                            @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();
        // Only ADMIN can approve or reject bookings
        if (user.getRole() != com.smartcampus.model.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can approve or reject bookings"));
        }
        String status = body.getOrDefault("status", "APPROVED"); // APPROVED or REJECTED
        String rejectionReason = body.get("rejectionReason");
        return bookingService.updateBookingStatus(id, status, rejectionReason)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        try {
            User user = getAuthenticatedUser(principal);
            boolean deleted = bookingService.deleteBooking(id, user.getId(), user.getRole().name());
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
            }
            return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            return bookingService.cancelBooking(id, user.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<?> getBookingQrDetails(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        // Get the actual booking to retrieve its QR validation data
        Optional<Booking> bookingOpt = bookingService.getBookingById(id);
        if (!bookingOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Booking booking = bookingOpt.get();
        return ResponseEntity.ok(Map.of("qrValidationData", booking.getQrValidationData()));
    }

    @GetMapping("/verify-qr")
    public ResponseEntity<?> verifyQrCode(
            @RequestParam String qrData,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String studentId) {
        // Public endpoint - no authentication required for QR check-in
        System.out.println("🔍 QR Verification Request - qrData: " + qrData + ", userId: " + userId + ", studentId: " + studentId);
        
        Optional<Booking> bookingOpt = bookingService.verifyQrData(qrData);
        
        if (!bookingOpt.isPresent()) {
            System.out.println("❌ QR Code NOT FOUND in database: " + qrData);
            return ResponseEntity.status(404).body(Map.of(
                "error", "INVALID_QR",
                "message", "This QR code is not recognized."
            ));
        }
        
        System.out.println("✅ QR Code FOUND - Booking ID: " + bookingOpt.get().getId());
        Booking booking = bookingOpt.get();
        LocalDateTime now = LocalDateTime.now();
        
        // Check if booking is not approved
        if (!"APPROVED".equals(booking.getStatus())) {
            String message = "CANCELLED".equals(booking.getStatus()) ? "Booking is CANCELLED." :
                           "REJECTED".equals(booking.getStatus()) ? "Booking is not APPROVED." :
                           "Booking status: " + booking.getStatus();
            return ResponseEntity.status(400).body(Map.of(
                "error", "NOT_ALLOWED",
                "message", message,
                "status", booking.getStatus()
            ));
        }
        
        // Check if booking time window is valid (allow check-in 15 mins before start time)
        LocalDateTime allowedCheckInTime = booking.getStartTime().minusMinutes(15);
        if (now.isBefore(allowedCheckInTime)) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "TOO_EARLY",
                "message", "Check-in opens 15 minutes before booking start time.",
                "startTime", booking.getStartTime()
            ));
        }
        
        // Check if booking has ended
        if (now.isAfter(booking.getEndTime())) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "EXPIRED",
                "message", "Booking time has ended.",
                "endTime", booking.getEndTime()
            ));
        }
        
        // ===== MULTI-STUDENT CHECK-IN (for lecture halls, labs, meeting rooms) =====
        if (userId != null && !userId.isEmpty()) {
            // Normalize userName for duplicate checking
            String normalizedUserName = userName != null ? userName.trim() : "";
            
            System.out.println("🔍 Check-in request - BookingId: " + booking.getId() + ", Student ID: '" + studentId + "', UserName: '" + normalizedUserName + "'");
            
            // Check for duplicate userId (Student ID or Email) - PRIMARY CHECK
            Optional<Attendance> existingByUserId = attendanceRepository.findByBookingIdAndUserId(booking.getId(), userId);
            
            if (existingByUserId.isPresent()) {
                Attendance existing = existingByUserId.get();
                long totalAttendees = attendanceRepository.countByBookingId(booking.getId());
                
                System.out.println("⚠️ DUPLICATE BLOCKED - Unique ID '" + userId + "' already checked in!");
                if (existing.getStudentId() != null && !existing.getStudentId().isEmpty()) {
                    System.out.println("   Student ID: " + existing.getStudentId());
                }
                System.out.println("   Existing record: Name='" + existing.getUserName() + "', CheckedInAt=" + existing.getCheckedInAt());
                System.out.println("   Attempted Name: '" + normalizedUserName + "'");
                
                // Create clear message based on whether studentId was used
                String duplicateMessage;
                if (existing.getStudentId() != null && !existing.getStudentId().isEmpty()) {
                    duplicateMessage = "This Student ID (" + existing.getStudentId() + ") has already been used to check in";
                    if (!normalizedUserName.equals(existing.getUserName())) {
                        duplicateMessage += " by '" + existing.getUserName() + "'";
                    }
                    duplicateMessage += ". You cannot check in twice with the same Student ID.";
                } else if (existing.getUserEmail() != null && !existing.getUserEmail().isEmpty()) {
                    duplicateMessage = "This Email (" + existing.getUserEmail() + ") has already been used to check in";
                    if (!normalizedUserName.equals(existing.getUserName())) {
                        duplicateMessage += " by '" + existing.getUserName() + "'";
                    }
                    duplicateMessage += ". You cannot check in twice with the same Email.";
                } else {
                    duplicateMessage = "You have already checked in for this session";
                    if (!normalizedUserName.equals(existing.getUserName())) {
                        duplicateMessage += " as '" + existing.getUserName() + "'";
                    }
                    duplicateMessage += ".";
                }
                
                return ResponseEntity.status(400).body(Map.of(
                    "error", "ALREADY_CHECKED_IN",
                    "message", duplicateMessage,
                    "checkedInAt", existing.getCheckedInAt(),
                    "booking", booking,
                    "totalAttendees", totalAttendees,
                    "expectedAttendees", booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : 0,
                    "existingName", existing.getUserName(),
                    "studentId", existing.getStudentId() != null ? existing.getStudentId() : ""
                ));
            }
            
            // Check by name (case-insensitive) - SECONDARY CHECK (for users who may not have userId)
            Optional<Attendance> existingByName = normalizedUserName.isEmpty() ? 
                Optional.empty() : 
                attendanceRepository.findByBookingIdAndUserNameIgnoreCase(booking.getId(), normalizedUserName);
            
            // If this exact name already checked in by a different user, block it
            if (existingByName.isPresent()) {
                Attendance existing = existingByName.get();
                long totalAttendees = attendanceRepository.countByBookingId(booking.getId());
                
                System.out.println("⚠️ DUPLICATE NAME BLOCKED - Name: '" + normalizedUserName + "' already exists");
                System.out.println("   Existing record: UserId='" + existing.getUserId() + "', CheckedInAt=" + existing.getCheckedInAt());
                
                return ResponseEntity.status(400).body(Map.of(
                    "error", "ALREADY_CHECKED_IN",
                    "message", "A person with this name has already checked in for this session.",
                    "checkedInAt", existing.getCheckedInAt(),
                    "booking", booking,
                    "totalAttendees", totalAttendees,
                    "expectedAttendees", booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : 0
                ));
            }
            
            // Create new attendance record
            Attendance attendance = Attendance.builder()
                    .bookingId(booking.getId())
                    .userId(userId)
                    .studentId(studentId != null ? studentId.trim() : null)
                    .userName(normalizedUserName.isEmpty() ? "Anonymous" : normalizedUserName)
                    .userEmail(userEmail != null ? userEmail.trim() : null)
                    .checkedInAt(now)
                    .build();
            
            attendanceRepository.save(attendance);
            long totalAttendees = attendanceRepository.countByBookingId(booking.getId());
            
            System.out.println("✅ NEW CHECK-IN SUCCESSFUL!");
            System.out.println("   Name: '" + normalizedUserName + "'");
            if (studentId != null && !studentId.trim().isEmpty()) {
                System.out.println("   Student ID: '" + studentId.trim() + "'");
            }
            System.out.println("   Unique ID: '" + userId + "'");
            System.out.println("   Progress: " + totalAttendees + "/" + (booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : "?"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Check-in Successful");
            response.put("booking", booking);
            response.put("checkedInAt", now);
            response.put("totalAttendees", totalAttendees);
            response.put("expectedAttendees", booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : 0);
            response.put("attendanceMode", "MULTI_STUDENT");
            
            return ResponseEntity.ok(response);
        }
        
        // ===== SINGLE CHECK-IN (for equipment bookings - old behavior) =====
        // Check if already checked in
        if (booking.getCheckedInAt() != null) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "ALREADY_CHECKED_IN",
                "message", "Already Checked In",
                "checkedInAt", booking.getCheckedInAt(),
                "booking", booking
            ));
        }
        
        // Update booking with check-in timestamp
        booking.setCheckedInAt(now);
        bookingService.updateCheckIn(booking);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Check-in Successful",
            "booking", booking,
            "checkedInAt", now,
            "attendanceMode", "SINGLE"
        ));
    }
    
    @GetMapping("/{id}/attendance")
    public ResponseEntity<?> getBookingAttendance(@PathVariable String id) {
        System.out.println("📊 Fetching attendance for booking: " + id);
        
        // Get attendance list for a booking
        Optional<Booking> bookingOpt = bookingService.getBookingById(id);
        
        if (!bookingOpt.isPresent()) {
            System.out.println("❌ Booking not found: " + id);
            return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
        }
        
        Booking booking = bookingOpt.get();
        List<Attendance> attendanceList = attendanceRepository.findByBookingIdOrderByCheckedInAtAsc(id);
        long totalAttendees = attendanceList.size();
        
        System.out.println("   Resource: " + booking.getResourceName());
        System.out.println("   Status: " + booking.getStatus());
        System.out.println("   Attendance: " + totalAttendees + "/" + (booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : 0));
        
        Map<String, Object> response = new HashMap<>();
        response.put("booking", booking);
        response.put("attendanceList", attendanceList);
        response.put("totalAttendees", totalAttendees);
        response.put("expectedAttendees", booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : 0);
        
        return ResponseEntity.ok(response);
    }
}
