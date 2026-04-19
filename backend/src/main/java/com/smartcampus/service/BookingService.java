package com.smartcampus.service;
//// Service logic and validation for bookings
import com.smartcampus.model.Booking;
import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository, NotificationService notificationService, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    public Booking createBooking(Booking booking) {
        System.out.println("Creating booking - Resource: " + booking.getResourceId() + 
                          ", Start: " + booking.getStartTime() + ", End: " + booking.getEndTime());
        
        // Validate booking times
        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            throw new RuntimeException("Start time and end time are required");
        }
        
        if (booking.getEndTime().isBefore(booking.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }
        
        if (booking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book resources in the past");
        }
        
        // 1. Conflict checking logic
        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
                booking.getResourceId(), 
                booking.getStartTime(), 
                booking.getEndTime()
        );

        if (!overlappingBookings.isEmpty()) {
            System.out.println("Found " + overlappingBookings.size() + " overlapping bookings");
            throw new RuntimeException("Resource is already booked during this time window");
        }

        // 2. Initial state
        booking.setStatus("PENDING");
        
        // Generate a unique token for QR code that can be verified later by admins
        String qrToken = UUID.randomUUID().toString() + "-" + booking.getResourceId();
        booking.setQrValidationData(qrToken);
        
        Booking saved = bookingRepository.save(booking);
        System.out.println("Booking created successfully with ID: " + saved.getId());
        
        // ✅ Notify all admins about new booking request
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                admin.getId(),
                "New Booking Request 📅",
                saved.getUserName() + " requested to book " + saved.getResourceName() + 
                " on " + saved.getStartTime().toLocalDate() + " at " + saved.getStartTime().toLocalTime(),
                saved.getId(),
                "BOOKING"
            );
        }
        
        return saved;
    }

    public Optional<Booking> updateBookingStatus(String id, String status, String rejectionReason) {
        return bookingRepository.findById(id).map(existing -> {
            existing.setStatus(status);
            if ("REJECTED".equals(status) && rejectionReason != null) {
                existing.setRejectionReason(rejectionReason);
            }
            Booking saved = bookingRepository.save(existing);
            
            // ✅ REQUIRED: Send notification for booking status changes
            if ("APPROVED".equals(status)) {
                // Booking Approved → notify the booking owner (USER)
                notificationService.createNotification(
                    saved.getUserId(),
                    "Booking Approved ✓",
                    "Your booking for " + saved.getResourceName() + " has been approved! Time: " + 
                    saved.getStartTime().toLocalDate() + " " + saved.getStartTime().toLocalTime(),
                    saved.getId(),
                    "BOOKING"
                );
            } else if ("REJECTED".equals(status)) {
                // Booking Rejected (with reason) → notify the booking owner (USER)
                String message = "Your booking for " + saved.getResourceName() + " has been rejected.";
                if (rejectionReason != null && !rejectionReason.isEmpty()) {
                    message += " Reason: " + rejectionReason;
                }
                notificationService.createNotification(
                    saved.getUserId(),
                    "Booking Rejected ✗",
                    message,
                    saved.getId(),
                    "BOOKING"
                );
            } else {
                // Generic notification for other status changes
                notificationService.createNotification(
                    saved.getUserId(),
                    "Booking " + status,
                    "Your booking for " + saved.getResourceName() + " status changed to " + status.toLowerCase(),
                    saved.getId(),
                    "BOOKING"
                );
            }
            
            return saved;
        });
    }

    public Optional<Booking> cancelBooking(String id, String userId) {
        return bookingRepository.findById(id).map(existing -> {
            if (!existing.getUserId().equals(userId)) {
                throw new RuntimeException("Unauthorized to cancel this booking");
            }
            existing.setStatus("CANCELLED");
            return bookingRepository.save(existing);
        });
    }

    public Optional<Booking> verifyQrData(String qrData) {
        // Find booking by QR validation data
        return bookingRepository.findByQrValidationData(qrData);
    }
    
    public Booking updateCheckIn(Booking booking) {
        return bookingRepository.save(booking);
    }
    
    public boolean deleteBooking(String id, String userId, String userRole) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            // Admins can delete any booking, regular users can only delete their own
            if (!"ADMIN".equals(userRole) && !booking.getUserId().equals(userId)) {
                throw new RuntimeException("Unauthorized to delete this booking");
            }
            bookingRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
