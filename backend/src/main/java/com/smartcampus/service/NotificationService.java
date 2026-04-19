package com.smartcampus.service;

import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createNotification(String userId, String title, String message, String relatedEntityId, String relatedEntityType) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<Notification> getUnreadUserNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public Optional<Notification> markAsRead(String notificationId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            return Optional.of(notificationRepository.save(n));
        }
        return Optional.empty();
    }
    
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        System.out.println("Marking " + unread.size() + " notifications as read for user: " + userId);
        unread.forEach(n -> {
            n.setRead(true);
            System.out.println("Marked notification " + n.getId() + " as read");
        });
        notificationRepository.saveAll(unread);
        System.out.println("Successfully saved " + unread.size() + " notifications");
    }
}
