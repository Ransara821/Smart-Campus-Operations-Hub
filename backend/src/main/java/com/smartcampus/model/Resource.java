package com.smartcampus.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Type is required")
    private String type; // LECTURE_HALL, LAB, EQUIPMENT
    
    @Min(value = 0, message = "Capacity must be positive")
    private int capacity;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @NotBlank(message = "Status is required")
    private String status; // ACTIVE, MAINTENANCE, INACTIVE
    
    // Additional metadata
    private String description;
    private String imageUrl;
    
    // Availability windows e.g. "Mon-Fri 08:00-18:00"
    private String availabilityWindows;
}
