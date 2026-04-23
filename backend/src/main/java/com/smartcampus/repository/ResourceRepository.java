package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    List<Resource> findByType(String type);
    List<Resource> findByStatus(String status);
    List<Resource> findByNameContainingIgnoreCase(String name);
    List<Resource> findByLocationContainingIgnoreCase(String location);
    
    // Find resources by capacity range
    @Query("{ 'capacity': { $gte: ?0, $lte: ?1 } }")
    List<Resource> findByCapacityBetween(int minCapacity, int maxCapacity);
    
    // Find resources with capacity greater than or equal to
    @Query("{ 'capacity': { $gte: ?0 } }")
    List<Resource> findByCapacityGreaterThanOrEqual(int capacity);
    
    // Find resources with capacity less than or equal to
    @Query("{ 'capacity': { $lte: ?0 } }")
    List<Resource> findByCapacityLessThanOrEqual(int capacity);
}
