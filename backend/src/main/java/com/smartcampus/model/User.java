package com.smartcampus.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String email;
    private String name;
    private String avatarUrl;
    private Role role;

    @JsonIgnore
    private String passwordHash;

    // For OAuth, we might want to store the provider Id
    private String googleId;
}
