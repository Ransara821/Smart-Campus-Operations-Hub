package com.smartcampus.controller;

import com.smartcampus.model.Comment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(OAuth2User principal) {
        if (principal == null) {
            // Dev mode: Return a default admin user
            // In production, this would throw 401
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
    public ResponseEntity<List<Ticket>> getTickets(@AuthenticationPrincipal OAuth2User principal,
                                                   @RequestParam(required = false) String context) {
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            System.out.println("❌ Auth Failed: User not found for principal");
            return ResponseEntity.status(401).build();
        }

        System.out.println("🔍 GET /api/tickets - User: " + user.getEmail() + " (ID: " + user.getId() + "), Role: " + user.getRole() + ", Context: " + context);

        if ("my-tickets".equals(context)) {
            return ResponseEntity.ok(ticketService.getUserTickets(user.getId()));
        } else if ("assigned".equals(context)) {
            System.out.println("📋 Fetching assigned tickets for technician ID: " + user.getId());
            return ResponseEntity.ok(ticketService.getTechnicianTickets(user.getId()));
        } else {
            return ResponseEntity.ok(ticketService.getAllTickets());
        }
    }

    @PostMapping
    public ResponseEntity<?> createTicket(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam(value = "resourceName", required = false, defaultValue = "") String resourceName,
            @RequestParam(value = "resourceId", required = false, defaultValue = "") String resourceId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "preferredContact", required = false) String preferredContact,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal OAuth2User principal) {
        
        System.out.println("===== CREATE TICKET REQUEST =====");
        System.out.println("Title: " + title);
        System.out.println("Description: " + description);
        System.out.println("ResourceName: " + resourceName);
        System.out.println("ResourceId: " + resourceId);
        System.out.println("Category: " + category);
        System.out.println("Priority: " + priority);
        System.out.println("PreferredContact: " + preferredContact);
        System.out.println("Images: " + (images != null ? images.size() + " file(s)" : "none"));
        
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            System.out.println("User authentication failed!");
            return ResponseEntity.status(401).body("Authentication required");
        }
        
        System.out.println("User: " + user.getName() + " (ID: " + user.getId() + ")");

        try {
            Ticket ticket = new Ticket();
            ticket.setTitle(title);
            ticket.setDescription(description);
            ticket.setResourceName(resourceName != null && !resourceName.isEmpty() ? resourceName : null);
            ticket.setResourceId(resourceId != null && !resourceId.isEmpty() ? resourceId : null);
            ticket.setCategory(category);
            ticket.setPriority(priority);
            ticket.setPreferredContact(preferredContact);
            ticket.setCreatorId(user.getId());
            ticket.setCreatorName(user.getName());

            Ticket created = ticketService.createTicket(ticket);
            System.out.println("Ticket created with ID: " + created.getId());
            
            // Upload images if provided (max 3)
            if (images != null && !images.isEmpty()) {
                int uploaded = 0;
                for (MultipartFile image : images) {
                    if (uploaded >= 3) break;
                    if (image != null && !image.isEmpty()) {
                        try {
                            String imageUrl = ticketService.uploadTicketImage(created.getId(), image);
                            System.out.println("Image uploaded: " + imageUrl);
                            uploaded++;
                        } catch (Exception e) {
                            System.err.println("Failed to upload image: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                }
            }

            System.out.println("===== TICKET CREATION SUCCESS =====");
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("===== TICKET CREATION FAILED =====");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to create ticket: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<?> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        try {
            String url = ticketService.uploadTicketImage(id, file);
            return ResponseEntity.ok(Map.of("imageUrl", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String rejectionReason = body.get("rejectionReason");
        return ticketService.updateTicketStatus(id, status, rejectionReason)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveTicket(@PathVariable String id, @RequestBody Map<String, String> body) {
        String resolutionNotes = body.get("resolutionNotes");
        return ticketService.updateTicketStatus(id, "RESOLVED", null).map(ticket -> {
            ticket.setResolutionNotes(resolutionNotes);
            Ticket saved = ticketService.saveTicket(ticket); // persist notes
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignTechnician(@PathVariable String id, @RequestBody Map<String, String> body) {
        String technicianId = body.get("technicianId");
        System.out.println("🎯 Assigning Ticket " + id + " to Technician " + technicianId);
        return ticketService.assignTechnician(id, technicianId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editTicket(@PathVariable String id, @RequestBody Ticket updatedTicket, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            Ticket edited = ticketService.editTicket(id, user.getId(), updatedTicket);
            return ResponseEntity.ok(edited);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            ticketService.deleteTicket(id, user.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Comments Endpoints ---

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody Comment comment, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        comment.setAuthorId(user.getId());
        comment.setAuthorName(user.getName());
        
        return ResponseEntity.ok(ticketService.addComment(id, comment));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> editComment(@PathVariable String commentId,
                                         @RequestBody Comment updatedComment,
                                         @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            Comment edited = ticketService.editComment(commentId, updatedComment.getText(), user.getId(), user.getRole().name());
            return ResponseEntity.ok(edited);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String commentId, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            ticketService.deleteComment(commentId, user.getId(), user.getRole().name());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
