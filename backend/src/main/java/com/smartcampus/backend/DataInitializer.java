package com.smartcampus.backend;

import com.smartcampus.model.*;
import com.smartcampus.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

        private final ResourceRepository resourceRepository;
        private final UserRepository userRepository;
        private final BookingRepository bookingRepository;
        private final TicketRepository ticketRepository;
        private final NotificationRepository notificationRepository;
        private final PasswordEncoder passwordEncoder;

        private static final String DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
        private static final String DEFAULT_ADMIN_NAME = "System Admin";
        private static final String DEFAULT_ADMIN_PASSWORD = "admin1234";

        public DataInitializer(ResourceRepository resourceRepository,
                        UserRepository userRepository,
                        BookingRepository bookingRepository,
                        TicketRepository ticketRepository,
                        NotificationRepository notificationRepository,
                        PasswordEncoder passwordEncoder) {
                this.resourceRepository = resourceRepository;
                this.userRepository = userRepository;
                this.bookingRepository = bookingRepository;
                this.ticketRepository = ticketRepository;
                this.notificationRepository = notificationRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        public void run(String... args) throws Exception {
                ensureDefaultAdminAccount();

                // Only initialize if database is empty (first-time setup only)
                if (userRepository.count() > 0) {
                        System.out.println("Database already contains data. Skipping initialization.");
                        return;
                }

                System.out.println("Database is empty. Initializing with seed data...");

                // Create sample users with IDs matching frontend dev login
                User admin = User.builder()
                                .id("dev-admin-123")
                                .email(DEFAULT_ADMIN_EMAIL)
                                .name(DEFAULT_ADMIN_NAME)
                                .role(Role.ADMIN)
                                .passwordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                                .build();

                User student1 = User.builder()
                                .id("dev-user-456") // Matches frontend dev login
                                .email("student@dev.local")
                                .name("Dev Student")
                                .role(Role.USER)
                                .build();

                User student2 = User.builder()
                                .email("jane.smith@student.edu")
                                .name("Jane Smith")
                                .role(Role.USER)
                                .build();

                User technician = User.builder()
                                .id("dev-tech-789") // Matches frontend dev login
                                .email("tech@dev.local")
                                .name("Dev Technician")
                                .role(Role.TECHNICIAN)
                                .build();

                List<User> users = userRepository.saveAll(List.of(admin, student1, student2, technician));
                System.out.println("Created " + users.size() + " users");

                // Create sample resources
                Resource lectureHall1 = Resource.builder()
                                .name("Main Auditorium")
                                .type("LECTURE_HALL")
                                .capacity(200)
                                .location("Building A, Floor 1")
                                .status("ACTIVE")
                                .description("Large auditorium with projector and sound system")
                                .imageUrl("https://images.unsplash.com/photo-1523580494863-6f3031224c94")
                                .build();

                Resource lectureHall2 = Resource.builder()
                                .name("CS Lecture Hall 101")
                                .type("LECTURE_HALL")
                                .capacity(50)
                                .location("Building B, Floor 2")
                                .status("ACTIVE")
                                .description("Computer Science department lecture hall")
                                .imageUrl("https://images.unsplash.com/photo-1562774053-701939374585")
                                .build();

                Resource lab1 = Resource.builder()
                                .name("Computer Lab A")
                                .type("LAB")
                                .capacity(30)
                                .location("Building C, Floor 3")
                                .status("ACTIVE")
                                .description("High-performance computers with latest software")
                                .imageUrl("https://images.unsplash.com/photo-1498050108023-c5249f4df085")
                                .build();

                Resource lab2 = Resource.builder()
                                .name("Physics Lab")
                                .type("LAB")
                                .capacity(25)
                                .location("Building D, Floor 1")
                                .status("MAINTENANCE")
                                .description("Equipment maintenance in progress")
                                .imageUrl("https://images.unsplash.com/photo-1532094349884-543bc11b234d")
                                .build();

                Resource equipment1 = Resource.builder()
                                .name("Projector - Sony 4K")
                                .type("EQUIPMENT")
                                .capacity(1)
                                .location("Equipment Room 101")
                                .status("ACTIVE")
                                .description("4K projector available for booking")
                                .imageUrl("https://images.unsplash.com/photo-1517694712202-14dd9538aa97")
                                .build();

                Resource equipment2 = Resource.builder()
                                .name("Camera Kit - Canon EOS")
                                .type("EQUIPMENT")
                                .capacity(1)
                                .location("Equipment Room 102")
                                .status("ACTIVE")
                                .description("Professional camera kit with lenses")
                                .imageUrl("https://images.unsplash.com/photo-1502920917128-1aa500764cbd")
                                .build();

                List<Resource> resources = resourceRepository.saveAll(
                                List.of(lectureHall1, lectureHall2, lab1, lab2, equipment1, equipment2));
                System.out.println("Created " + resources.size() + " resources");

                // Create sample bookings
                Booking booking1 = Booking.builder()
                                .resourceId(lectureHall1.getId())
                                .resourceName(lectureHall1.getName())
                                .userId(student1.getId())
                                .userName(student1.getName())
                                .startTime(LocalDateTime.now().minusMinutes(5).withSecond(0).withNano(0))
                                .endTime(LocalDateTime.now().plusHours(2).withSecond(0).withNano(0))
                                .purpose("Guest Lecture on AI")
                                .status("APPROVED")
                                .qrValidationData("QR-TEST-ACTIVE-001")
                                .build();

                Booking booking2 = Booking.builder()
                                .resourceId(lab1.getId())
                                .resourceName(lab1.getName())
                                .userId(student2.getId())
                                .userName(student2.getName())
                                .startTime(LocalDateTime.now().plusDays(1).withHour(14).withMinute(0))
                                .endTime(LocalDateTime.now().plusDays(1).withHour(16).withMinute(0))
                                .purpose("Project Development")
                                .status("PENDING")
                                .qrValidationData("QR-TEST-PENDING-002")
                                .build();

                Booking booking3 = Booking.builder()
                                .resourceId(equipment1.getId())
                                .resourceName(equipment1.getName())
                                .userId(student1.getId())
                                .userName(student1.getName())
                                .startTime(LocalDateTime.now().plusDays(3).withHour(9).withMinute(0))
                                .endTime(LocalDateTime.now().plusDays(3).withHour(11).withMinute(0))
                                .purpose("Student Presentation")
                                .status("APPROVED")
                                .qrValidationData("QR-TEST-FUTURE-003")
                                .build();

                List<Booking> bookings = bookingRepository.saveAll(List.of(booking1, booking2, booking3));
                System.out.println("Created " + bookings.size() + " bookings");

                // Create sample tickets
                Ticket ticket1 = Ticket.builder()
                                .title("Projector not working")
                                .description("The projector in Main Auditorium is not turning on. Checked power cable.")
                                .creatorId(student1.getId())
                                .creatorName(student1.getName())
                                .resourceId(lectureHall1.getId())
                                .resourceName(lectureHall1.getName())
                                .assignedTechnicianId(technician.getId())
                                .status("IN_PROGRESS")
                                .createdAt(LocalDateTime.now().minusDays(1))
                                .updatedAt(LocalDateTime.now().minusHours(2))
                                .build();

                Ticket ticket2 = Ticket.builder()
                                .title("AC not cooling")
                                .description("Air conditioning in Computer Lab A is not functioning properly")
                                .creatorId(student2.getId())
                                .creatorName(student2.getName())
                                .resourceId(lab1.getId())
                                .resourceName(lab1.getName())
                                .status("OPEN")
                                .createdAt(LocalDateTime.now().minusHours(5))
                                .updatedAt(LocalDateTime.now().minusHours(5))
                                .build();

                Ticket ticket3 = Ticket.builder()
                                .title("Equipment maintenance completed")
                                .description("Annual maintenance of physics lab equipment completed successfully")
                                .creatorId(technician.getId())
                                .creatorName(technician.getName())
                                .resourceId(lab2.getId())
                                .resourceName(lab2.getName())
                                .assignedTechnicianId(technician.getId())
                                .status("RESOLVED")
                                .createdAt(LocalDateTime.now().minusDays(3))
                                .updatedAt(LocalDateTime.now().minusDays(1))
                                .build();

                List<Ticket> tickets = ticketRepository.saveAll(List.of(ticket1, ticket2, ticket3));
                System.out.println("Created " + tickets.size() + " tickets");

                // Create sample notifications
                Notification notif1 = Notification.builder()
                                .userId(student1.getId())
                                .title("Booking Approved")
                                .message("Your booking for Main Auditorium has been approved")
                                .relatedEntityType("BOOKING")
                                .relatedEntityId(booking1.getId())
                                .isRead(false)
                                .createdAt(LocalDateTime.now().minusHours(1))
                                .build();

                Notification notif2 = Notification.builder()
                                .userId(student2.getId())
                                .title("Booking Pending")
                                .message("Your booking request is pending approval")
                                .relatedEntityType("BOOKING")
                                .relatedEntityId(booking2.getId())
                                .isRead(false)
                                .createdAt(LocalDateTime.now().minusMinutes(30))
                                .build();

                Notification notif3 = Notification.builder()
                                .userId(technician.getId())
                                .title("Ticket Assigned")
                                .message("New maintenance ticket assigned to you")
                                .relatedEntityType("TICKET")
                                .relatedEntityId(ticket1.getId())
                                .isRead(true)
                                .createdAt(LocalDateTime.now().minusDays(1))
                                .build();

                List<Notification> notifications = notificationRepository.saveAll(List.of(notif1, notif2, notif3));
                System.out.println("Created " + notifications.size() + " notifications");

                System.out.println("Database initialization completed successfully!");
        }

        private void ensureDefaultAdminAccount() {
                Optional<User> existingAdmin = userRepository.findByEmail(DEFAULT_ADMIN_EMAIL);

                if (existingAdmin.isPresent()) {
                        User admin = existingAdmin.get();
                        admin.setRole(Role.ADMIN);
                        admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
                        userRepository.save(admin);
                        System.out.println("Default admin account updated: " + DEFAULT_ADMIN_EMAIL);
                        return;
                }

                User admin = User.builder()
                                .email(DEFAULT_ADMIN_EMAIL)
                                .name(DEFAULT_ADMIN_NAME)
                                .role(Role.ADMIN)
                                .passwordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                                .build();
                userRepository.save(admin);
                System.out.println("Default admin account created: " + DEFAULT_ADMIN_EMAIL);
        }
}
