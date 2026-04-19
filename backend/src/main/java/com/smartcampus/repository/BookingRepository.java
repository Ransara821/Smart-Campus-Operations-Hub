package com.smartcampus.repository;
//// Database operations for Booking
import com.smartcampus.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserIdOrderByStartTimeDesc(String userId);
    List<Booking> findByStatusOrderByStartTimeDesc(String status);
    
    // Find booking by QR validation data
    Optional<Booking> findByQrValidationData(String qrValidationData);
    
    // Check conflicts: Find bookings for a resource that overlap with a given time window
    // Two bookings overlap if: (StartA < EndB) AND (EndA > StartB)
    // Only check PENDING and APPROVED bookings (ignore CANCELLED and REJECTED)
    @Query("{ 'resourceId': ?0, " +
           "'status': { $in: ['PENDING', 'APPROVED'] }, " +
           "'startTime': { $lt: ?2 }, " +
           "'endTime': { $gt: ?1 } }")
    List<Booking> findOverlappingBookings(String resourceId, LocalDateTime startTime, LocalDateTime endTime);
}
