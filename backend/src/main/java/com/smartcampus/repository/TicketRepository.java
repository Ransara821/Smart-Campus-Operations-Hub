package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByCreatorIdOrderByCreatedAtDesc(String creatorId);
    List<Ticket> findByAssignedTechnicianIdOrderByCreatedAtDesc(String technicianId);
    List<Ticket> findAllByOrderByCreatedAtDesc();
}
