package com.smartcampus.service;

import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAllResources(String search) {
        if (search != null && !search.isEmpty()) {
            return resourceRepository.findByNameContainingIgnoreCase(search);
        }
        return resourceRepository.findAll();
    }

    public Optional<Resource> getResourceById(String id) {
        return resourceRepository.findById(id);
    }

    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public Optional<Resource> updateResource(String id, Resource resourceDetails) {
        return resourceRepository.findById(id).map(existing -> {
            existing.setName(resourceDetails.getName());
            existing.setType(resourceDetails.getType());
            existing.setCapacity(resourceDetails.getCapacity());
            existing.setLocation(resourceDetails.getLocation());
            existing.setStatus(resourceDetails.getStatus());
            existing.setDescription(resourceDetails.getDescription());
            existing.setImageUrl(resourceDetails.getImageUrl());
            return resourceRepository.save(existing);
        });
    }

    public Optional<Resource> updateStatus(String id, String status) {
        return resourceRepository.findById(id).map(existing -> {
            existing.setStatus(status);
            return resourceRepository.save(existing);
        });
    }

    public void deleteResource(String id) {
        resourceRepository.deleteById(id);
    }
}
