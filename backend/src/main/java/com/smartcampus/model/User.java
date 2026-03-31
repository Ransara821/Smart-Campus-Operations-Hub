package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "users")
public class User {

    @Id
    private String id;          // MongoDB uses String id, not Long

    @Indexed(unique = true)
    private String email;

    private String firstName;
    private String lastName;
    private String name;        // Legacy field, kept for backward compatibility
    private String password;    // Hashed password for email/password login
    private String picture;
    private String googleId;
    private Role role;

    public User() {
    }

    public User(String id, String email, String firstName, String lastName, String name, String password, String picture, String googleId, Role role) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.name = name;
        this.password = password;
        this.picture = picture;
        this.googleId = googleId;
        this.role = role;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public static class UserBuilder {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String name;
        private String password;
        private String picture;
        private String googleId;
        private Role role;

        public UserBuilder id(String id) { this.id = id; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserBuilder name(String name) { this.name = name; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder picture(String picture) { this.picture = picture; return this; }
        public UserBuilder googleId(String googleId) { this.googleId = googleId; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }

        public User build() {
            return new User(id, email, firstName, lastName, name, password, picture, googleId, role);
        }
    }
}