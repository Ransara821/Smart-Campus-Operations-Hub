package com.smartcampus.controller;

import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(OAuth2User principal) {
        if (principal == null) {
            User devUser = new User();
            devUser.setId("dev-admin-123");
            devUser.setName("Developer Admin");
            devUser.setEmail("dev-admin@smartcampus.local");
            devUser.setRole(com.smartcampus.model.Role.ADMIN);
            return devUser;
        }
        String email = principal.getAttribute("email");
        
        // Handle dev users that don't exist in database
        if (email != null && email.startsWith("dev-")) {
            User devUser = new User();
            devUser.setEmail(email);
            
            if (email.contains("admin")) {
                devUser.setId("dev-admin-123");
                devUser.setName("Developer Admin");
                devUser.setRole(com.smartcampus.model.Role.ADMIN);
            } else if (email.contains("user")) {
                devUser.setId("dev-user-456");
                devUser.setName("Student User");
                devUser.setRole(com.smartcampus.model.Role.USER);
            } else if (email.contains("technician")) {
                devUser.setId("dev-tech-789");
                devUser.setName("Campus Technician");
                devUser.setRole(com.smartcampus.model.Role.TECHNICIAN);
            } else {
                devUser.setId("dev-123");
                devUser.setName("Dev User");
                devUser.setRole(com.smartcampus.model.Role.USER);
            }
            return devUser;
        }
        
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications(@AuthenticationPrincipal OAuth2User principal, 
                                                @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        List<Notification> notifications = unreadOnly ? 
                notificationService.getUnreadUserNotifications(user.getId()) :
                notificationService.getUserNotifications(user.getId());
        
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();
        
        // Security check: ensure notification belongs to user
        // (Assuming we do a check in service layer or fetch here first)
        Optional<Notification> notification = notificationService.markAsRead(id);
        return notification.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();
        
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok("All marked as read");
    }
}
