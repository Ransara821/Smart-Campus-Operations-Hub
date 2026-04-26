package com.smartcampus.service;

import com.smartcampus.model.Comment;
import com.smartcampus.model.Role;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // A directory inside the project to save uploaded ticket images safely
    private final String UPLOAD_DIR = "uploads/tickets/";

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public TicketService(TicketRepository ticketRepository, CommentRepository commentRepository, NotificationService notificationService, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        
        // Ensure upload directory exists
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Ticket> getUserTickets(String userId) {
        return ticketRepository.findByCreatorIdOrderByCreatedAtDesc(userId);
    }

    public List<Ticket> getTechnicianTickets(String technicianId) {
        System.out.println("🗄️ Querying DB for tickets assigned to: " + technicianId);
        List<Ticket> tickets = ticketRepository.findByAssignedTechnicianIdOrderByCreatedAtDesc(technicianId);
        System.out.println("📊 Found " + tickets.size() + " tickets");
        return tickets;
    }

    public Ticket createTicket(Ticket ticket) {
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket saved = ticketRepository.save(ticket);
        
        // ✅ Notify all admins about new ticket
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        String resourceInfo = saved.getResourceName() != null ? 
            " for " + saved.getResourceName() : "";
        
        for (User admin : admins) {
            notificationService.createNotification(
                admin.getId(),
                "New Ticket Raised 🎫",
                saved.getCreatorName() + " raised a ticket: \"" + saved.getTitle() + "\"" + resourceInfo,
                saved.getId(),
                "TICKET"
            );
        }
        
        return saved;
    }

    public Ticket saveTicket(Ticket ticket) {
        return ticketRepository.save(ticket);
    }

    public String uploadTicketImage(String ticketId, MultipartFile file) throws IOException {
        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) throw new RuntimeException("Ticket not found");

        Ticket ticket = ticketOpt.get();
        if (ticket.getImageUrls() != null && ticket.getImageUrls().size() >= 3) {
            throw new RuntimeException("Maximum of 3 images allowed per ticket");
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        // Use configured base URL for accessibility
        String imageUrl = baseUrl + "/uploads/tickets/" + fileName;

        if (ticket.getImageUrls() == null) {
            ticket.setImageUrls(new java.util.ArrayList<>());
        }
        ticket.getImageUrls().add(imageUrl);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        return imageUrl;
    }

    public Optional<Ticket> updateTicketStatus(String id, String status, String rejectionReason) {
        return ticketRepository.findById(id).map(existing -> {
            existing.setStatus(status);
            if (rejectionReason != null) {
                existing.setRejectionReason(rejectionReason);
            }
            existing.setUpdatedAt(LocalDateTime.now());
            Ticket saved = ticketRepository.save(existing);
            
            // ✅ REQUIRED: Ticket status changes → notify ticket owner (USER)
            String title;
            String message;
            
            switch (status) {
                case "OPEN":
                    title = "Ticket Opened";
                    message = "Your ticket '" + saved.getTitle() + "' has been opened and is awaiting review.";
                    break;
                case "IN_PROGRESS":
                    title = "Ticket In Progress";
                    message = "Your ticket '" + saved.getTitle() + "' is now being worked on.";
                    break;
                case "RESOLVED":
                    title = "Ticket Resolved ✓";
                    message = "Your ticket '" + saved.getTitle() + "' has been resolved!";
                    break;
                case "CLOSED":
                    title = "Ticket Closed";
                    message = "Your ticket '" + saved.getTitle() + "' has been closed.";
                    break;
                case "REJECTED":
                    title = "Ticket Rejected ✗";
                    message = "Your ticket '" + saved.getTitle() + "' has been rejected.";
                    if (saved.getRejectionReason() != null && !saved.getRejectionReason().isEmpty()) {
                        message += " Reason: " + saved.getRejectionReason();
                    }
                    break;
                default:
                    title = "Ticket Status Updated";
                    message = "Your ticket '" + saved.getTitle() + "' status changed to " + status;
            }
            
            notificationService.createNotification(
                saved.getCreatorId(),
                title,
                message,
                saved.getId(),
                "TICKET"
            );
            return saved;
        });
    }

    public Optional<Ticket> assignTechnician(String id, String technicianId) {
        return ticketRepository.findById(id).map(existing -> {
            System.out.println("📝 Saving ticket " + id + " with assignedTechnicianId: " + technicianId);
            existing.setAssignedTechnicianId(technicianId);
            
            // Set technician name
            userRepository.findById(technicianId).ifPresent(tech -> {
                System.out.println("👤 Found Technician Name: " + tech.getName());
                existing.setAssignedTechnicianName(tech.getName());
            });
            
            existing.setStatus("IN_PROGRESS");
            existing.setUpdatedAt(LocalDateTime.now());
            
            Ticket saved = ticketRepository.save(existing);
            
            // Notify technician
            notificationService.createNotification(
                technicianId,
                "New Assignment",
                "You have been assigned to ticket: " + saved.getTitle(),
                saved.getId(),
                "TICKET"
            );
            return saved;
        });
    }

    public Ticket editTicket(String id, String userId, Ticket updatedTicket) {
        return ticketRepository.findById(id).map(existing -> {
            // Only creator can edit
            if (!existing.getCreatorId().equals(userId)) {
                throw new RuntimeException("Not authorized to edit this ticket");
            }
            // Only OPEN tickets can be edited
            if (!"OPEN".equals(existing.getStatus())) {
                throw new RuntimeException("Only OPEN tickets can be edited");
            }
            
            if (!existing.isEdited()) {
                existing.setOriginalTitle(existing.getTitle());
                existing.setOriginalDescription(existing.getDescription());
                existing.setEdited(true);
            }
            
            existing.setTitle(updatedTicket.getTitle());
            existing.setDescription(updatedTicket.getDescription());
            existing.setCategory(updatedTicket.getCategory());
            existing.setPriority(updatedTicket.getPriority());
            existing.setPreferredContact(updatedTicket.getPreferredContact());
            if (updatedTicket.getResourceId() != null) {
                 existing.setResourceId(updatedTicket.getResourceId());
                 existing.setResourceName(updatedTicket.getResourceName());
            }
            
            existing.setUpdatedAt(LocalDateTime.now());
            return ticketRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    public void deleteTicket(String id, String userId) {
        ticketRepository.findById(id).ifPresent(existing -> {
            // Only creator can delete
            if (!existing.getCreatorId().equals(userId)) {
                throw new RuntimeException("Not authorized to delete this ticket");
            }
            // Only OPEN tickets can be deleted
            if (!"OPEN".equals(existing.getStatus())) {
                throw new RuntimeException("Only OPEN tickets can be deleted");
            }
            
            ticketRepository.deleteById(id);
        });
    }

    // --- Comments Logic ---
    
    public List<Comment> getTicketComments(String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    public Comment addComment(String ticketId, Comment comment) {
        comment.setTicketId(ticketId);
        comment.setCreatedAt(LocalDateTime.now());
        Comment saved = commentRepository.save(comment);
        
        ticketRepository.findById(ticketId).ifPresent(t -> {
            t.setUpdatedAt(LocalDateTime.now());
            ticketRepository.save(t);
            
            // If someone other than creator comments, notify creator
            if (!t.getCreatorId().equals(comment.getAuthorId())) {
                notificationService.createNotification(
                    t.getCreatorId(),
                    "New Comment",
                    "New comment on your ticket: " + t.getTitle(),
                    t.getId(),
                    "TICKET"
                );
            }
        });
        
        return saved;
    }

    public void deleteComment(String commentId, String authorId, String userRole) {
        commentRepository.findById(commentId).ifPresent(c -> {
            // Ownership rule: user must be author or ADMIN
            if (c.getAuthorId().equals(authorId) || "ADMIN".equals(userRole)) {
                commentRepository.deleteById(commentId);
            } else {
                throw new RuntimeException("Not authorized to delete comment");
            }
        });
    }

    public Comment editComment(String commentId, String newText, String authorId, String userRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        // Ownership rule: only author can edit (not even ADMIN — edits must be authentic)
        if (!comment.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized to edit this comment");
        }
        comment.setText(newText);
        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }
}
