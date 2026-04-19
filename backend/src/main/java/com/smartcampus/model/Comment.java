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
@Document(collection = "comments")
public class Comment {

    @Id
    private String id;
    
    private String ticketId;
    
    private String authorId;
    private String authorName;
    
    private String text;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt; // Set when comment is edited
}
