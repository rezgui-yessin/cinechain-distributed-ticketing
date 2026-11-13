package com.cinechain.controller;

import com.cinechain.dto.media.CloudinaryUploadResponse;
import com.cinechain.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MediaController {

    private final CloudinaryService cloudinaryService;

    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER')")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CloudinaryUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder
    ) {
        return ResponseEntity.ok(cloudinaryService.uploadImage(file, folder));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteImage(@RequestParam("publicId") String publicId) {
        return ResponseEntity.ok(cloudinaryService.deleteImage(publicId));
    }
}
