package com.cinechain.service;

import com.cinechain.dto.media.CloudinaryUploadResponse;
import com.cinechain.exception.BadRequestException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload a MultipartFile to Cloudinary in a designated folder.
     */
    public CloudinaryUploadResponse uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        String targetFolder = (folder == null || folder.isBlank()) ? "cinechain/uploads" : "cinechain/" + folder;

        try {
            String originalName = file.getOriginalFilename();
            String baseName = originalName != null ? originalName.replaceAll("[^a-zA-Z0-9.-]", "_") : "img";
            String publicId = UUID.randomUUID().toString().substring(0, 8) + "_" + baseName;

            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", targetFolder,
                    "public_id", publicId,
                    "overwrite", true,
                    "resource_type", "image"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            log.info("Uploaded image to Cloudinary: publicId={}, secureUrl={}",
                    uploadResult.get("public_id"), uploadResult.get("secure_url"));

            return mapUploadResult(uploadResult, targetFolder);
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to upload image to Cloudinary: " + e.getMessage());
        }
    }

    /**
     * Upload raw image bytes to Cloudinary.
     */
    public CloudinaryUploadResponse uploadBytes(byte[] data, String fileName, String folder) {
        if (data == null || data.length == 0) {
            throw new BadRequestException("Image data cannot be empty");
        }

        String targetFolder = (folder == null || folder.isBlank()) ? "cinechain/uploads" : "cinechain/" + folder;
        String publicId = UUID.randomUUID().toString().substring(0, 8) + "_" + (fileName != null ? fileName : "file");

        try {
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", targetFolder,
                    "public_id", publicId,
                    "overwrite", true,
                    "resource_type", "image"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(data, uploadParams);

            log.info("Uploaded bytes to Cloudinary: publicId={}, secureUrl={}",
                    uploadResult.get("public_id"), uploadResult.get("secure_url"));

            return mapUploadResult(uploadResult, targetFolder);
        } catch (IOException e) {
            log.error("Cloudinary byte upload failed: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to upload image bytes to Cloudinary: " + e.getMessage());
        }
    }

    /**
     * Delete an image from Cloudinary by its publicId.
     */
    public Map<String, Object> deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            throw new BadRequestException("Public ID cannot be blank");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted image from Cloudinary: publicId={}, result={}", publicId, result.get("result"));
            return result;
        } catch (IOException e) {
            log.error("Cloudinary delete failed: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to delete image from Cloudinary: " + e.getMessage());
        }
    }

    private CloudinaryUploadResponse mapUploadResult(Map<String, Object> uploadResult, String folder) {
        return CloudinaryUploadResponse.builder()
                .publicId((String) uploadResult.get("public_id"))
                .url((String) uploadResult.get("url"))
                .secureUrl((String) uploadResult.get("secure_url"))
                .format((String) uploadResult.get("format"))
                .width(uploadResult.get("width") instanceof Number n ? n.intValue() : null)
                .height(uploadResult.get("height") instanceof Number n ? n.intValue() : null)
                .bytes(uploadResult.get("bytes") instanceof Number n ? n.longValue() : null)
                .resourceType((String) uploadResult.get("resource_type"))
                .folder(folder)
                .build();
    }
}
