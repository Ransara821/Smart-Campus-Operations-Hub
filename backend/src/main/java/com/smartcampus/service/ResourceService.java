package com.smartcampus.service;

import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAllResources(String search, String type, Integer minCapacity, Integer maxCapacity, String location) {
        List<Resource> resources = resourceRepository.findAll();
        
        // Apply search filter (name search)
        if (search != null && !search.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> r.getName().toLowerCase().contains(search.toLowerCase()) ||
                               r.getLocation().toLowerCase().contains(search.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        // Apply type filter
        if (type != null && !type.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> r.getType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
        }
        
        // Apply location filter
        if (location != null && !location.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> r.getLocation().toLowerCase().contains(location.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        // Apply capacity filters
        if (minCapacity != null) {
            resources = resources.stream()
                    .filter(r -> r.getCapacity() >= minCapacity)
                    .collect(Collectors.toList());
        }
        
        if (maxCapacity != null) {
            resources = resources.stream()
                    .filter(r -> r.getCapacity() <= maxCapacity)
                    .collect(Collectors.toList());
        }
        
        return resources;
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
