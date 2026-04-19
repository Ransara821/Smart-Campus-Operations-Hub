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
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;
    
    private String userId; // The user who will receive this notification
    private String title;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
    
    // Optionally link to an entity like Booking or Ticket
    private String relatedEntityId;
    private String relatedEntityType; // e.g., "BOOKING", "TICKET"
}
