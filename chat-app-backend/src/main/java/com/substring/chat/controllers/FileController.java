package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class FileController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @PostMapping("/upload-message")
    public ResponseEntity<?> uploadFileMessage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sender") String sender,
            @RequestParam("senderFullName") String senderFullName,
            @RequestParam("roomId") String roomId) {

        System.out.println("=== FILE UPLOAD MESSAGE REQUEST ===");
        System.out.println("File: " + file.getOriginalFilename());
        System.out.println("Size: " + file.getSize());
        System.out.println("Sender: " + sender);
        System.out.println("Room ID: " + roomId);
        System.out.println("Upload Dir: " + uploadDir);

        try {
            if (file.isEmpty()) {
                System.out.println("ERROR: File is empty");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Please select a file to upload"));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            System.out.println("Upload path: " + uploadPath.toString());

            if (!Files.exists(uploadPath)) {
                System.out.println("Creating upload directory: " + uploadPath);
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName != null && originalFileName.contains(".")
                    ? originalFileName.substring(originalFileName.lastIndexOf("."))
                    : "";
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Save file to disk
            Path filePath = uploadPath.resolve(uniqueFileName);
            System.out.println("Saving file to: " + filePath.toString());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved successfully");

            // Determine message type based on file content type
            String contentType = file.getContentType();
            String messageType = determineMessageType(contentType, fileExtension);
            System.out.println("Message type: " + messageType);

            // Create message entity
            Message message = new Message();
            message.setSender(sender);
            message.setSenderFullName(senderFullName);
            message.setRoomId(roomId);
            message.setMessageType(messageType);

            // For file messages, store original filename as content for display
            message.setContent(originalFileName);

            // Set file-related fields
            message.setFileUrl("/api/v1/files/download/" + uniqueFileName);
            message.setFileName(uniqueFileName);
            message.setOriginalFileName(originalFileName);
            message.setFileType(contentType);
            message.setFileSize(file.getSize());

            // Set timestamps
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS"));
            message.setTimeStamp(timestamp);
            message.setCreatedAt(LocalDateTime.now());

            System.out.println("Saving message to database...");
            // Save to database
            Message savedMessage = messageRepository.save(message);
            System.out.println("Message saved with ID: " + savedMessage.getId());

            // Broadcast to WebSocket
            try {
                messagingTemplate.convertAndSend("/topic/messages/" + roomId, savedMessage);
                System.out.println("Message broadcasted to WebSocket");
            } catch (Exception e) {
                System.out.println("WARNING: Failed to broadcast to WebSocket: " + e.getMessage());
                // Continue anyway - file upload succeeded
            }

            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File uploaded successfully");
            response.put("messageId", savedMessage.getId());
            response.put("fileUrl", message.getFileUrl());
            response.put("fileName", originalFileName);
            response.put("messageType", messageType);
            response.put("fileSize", file.getSize());

            System.out.println("Upload successful: " + response);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            System.err.println("IO Error during file upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", "Failed to upload file: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("General error during file upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType;
                try {
                    contentType = Files.probeContentType(filePath);
                    if (contentType == null) {
                        contentType = "application/octet-stream";
                    }
                } catch (IOException e) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error downloading file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String determineMessageType(String contentType, String fileExtension) {
        if (contentType == null) {
            contentType = "";
        }

        // Image types
        if (contentType.startsWith("image/") ||
                fileExtension.toLowerCase().matches("\\.(jpg|jpeg|png|gif|bmp|webp|svg)$")) {
            return "image";
        }

        // Video types
        if (contentType.startsWith("video/") ||
                fileExtension.toLowerCase().matches("\\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp)$")) {
            return "video";
        }

        // Audio types
        if (contentType.startsWith("audio/") ||
                fileExtension.toLowerCase().matches("\\.(mp3|wav|flac|aac|ogg|wma|m4a)$")) {
            return "audio";
        }

        // Document types
        if (contentType.equals("application/pdf") ||
                contentType.startsWith("application/msword") ||
                contentType.startsWith("application/vnd.openxmlformats-officedocument") ||
                fileExtension.toLowerCase().matches("\\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$")) {
            return "document";
        }

        // Default to document for unknown types
        return "document";
    }
}