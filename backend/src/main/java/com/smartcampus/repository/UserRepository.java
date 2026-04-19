package com.smartcampus.repository;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    List<User> findByRole(Role role);
}
