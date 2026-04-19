package com.smartcampus.model;

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
@Document(collection = "attendance")
public class Attendance {

    @Id
    private String id;
    
    private String bookingId; // Which booking this attendance is for
    private String userId; // Unique identifier (Student ID or Email)
    private String studentId; // Student ID (if provided)
    private String userName; // Name of the student
    private String userEmail; // Email of the student
    
    private LocalDateTime checkedInAt; // When they checked in
    
    // Optional: Location verification
    private String deviceInfo; // Device used for check-in (optional)
}
