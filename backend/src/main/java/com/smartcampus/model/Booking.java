package com.smartcampus.model;

//// Entity class for Booking
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String resourceId; // Which facility/resource.
    private String resourceName;
    private String userId; // Who booked it.
    private String userName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String purpose;
    private Integer expectedAttendees; // Number of expected attendees.
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED.
    private String rejectionReason; // Reason for rejection (if applicable).

    // QR details.
    private String qrValidationData;
    private LocalDateTime checkedInAt; // Timestamp when QR was verified and checked in.
}
