package com.smartcampus.repository;

import com.smartcampus.model.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    
    // Find all attendees for a specific booking
    List<Attendance> findByBookingIdOrderByCheckedInAtAsc(String bookingId);
    
    // Check if a user has already checked in for a specific booking
    Optional<Attendance> findByBookingIdAndUserId(String bookingId, String userId);
    
    // Check if a user name has already checked in for a specific booking (case-insensitive)
    Optional<Attendance> findByBookingIdAndUserNameIgnoreCase(String bookingId, String userName);
    
    // Count total attendees for a booking
    long countByBookingId(String bookingId);
}
