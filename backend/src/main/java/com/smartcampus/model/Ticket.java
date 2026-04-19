package com.smartcampus.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;
    
    private String title;
    private String description;
    
    private String creatorId; // User who opened the ticket
    private String creatorName;
    
    private String resourceId; // Facility/Equipment having issue
    private String resourceName;
    
    private String assignedTechnicianId; // TECHNICIAN role user ID
    
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    
    private String rejectionReason; // Used when status is REJECTED
    
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>(); // Up to 3 uploaded image URLs

    private String category;
    private String priority;
    private String preferredContact;
    private String assignedTechnicianName;
    private String resolutionNotes;
    
    private boolean isEdited;
    private String originalTitle;
    private String originalDescription;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
