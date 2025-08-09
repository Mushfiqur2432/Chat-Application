package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.MessageRepository;
import com.substring.chat.repositories.RoomRepository;
import com.substring.chat.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    // Inner classes for request DTOs
    public static class CreateRoomRequest {
        private String roomName;
        private String password;
        private String createdBy;

        // Getters and setters
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    }

    public static class JoinRoomRequest {
        private String roomId;
        private String password;
        private String username;

        // Getters and setters
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createRoom(@RequestBody CreateRoomRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== CREATE ROOM REQUEST ===");
            System.out.println("Room Name: " + request.getRoomName());
            System.out.println("Created By: " + request.getCreatedBy());
            System.out.println("Has Password: " + (request.getPassword() != null && !request.getPassword().isEmpty()));

            // Validation
            if (request.getRoomName() == null || request.getRoomName().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Room name is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getCreatedBy() == null || request.getCreatedBy().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Creator username is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if room name already exists
            if (roomRepository.existsByRoomName(request.getRoomName())) {
                response.put("success", false);
                response.put("message", "Room name already exists");
                return ResponseEntity.badRequest().body(response);
            }

            // Generate unique room ID
            String roomId;
            do {
                roomId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            } while (roomRepository.existsByRoomId(roomId));

            // Create new room
            Room room = new Room();
            room.setRoomId(roomId);
            room.setRoomName(request.getRoomName().trim());
            room.setCreatedBy(request.getCreatedBy().trim());
            room.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            // Set password if provided
            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                room.setPassword(request.getPassword());
            }

            Room savedRoom = roomRepository.save(room);
            System.out.println("=== ROOM CREATED SUCCESSFULLY ===");
            System.out.println("Room ID: " + savedRoom.getRoomId());

            // Create room data for response
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("roomId", savedRoom.getRoomId());
            roomData.put("roomName", savedRoom.getRoomName());
            roomData.put("createdBy", savedRoom.getCreatedBy());
            roomData.put("createdAt", savedRoom.getCreatedAt());

            response.put("success", true);
            response.put("message", "Room created successfully");
            response.put("roomId", savedRoom.getRoomId());
            response.put("room", roomData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== CREATE ROOM ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "Failed to create room: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinRoom(@RequestBody JoinRoomRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== JOIN ROOM REQUEST ===");
            System.out.println("Room ID: " + request.getRoomId());
            System.out.println("Username: " + request.getUsername());

            // Validation
            if (request.getRoomId() == null || request.getRoomId().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Room ID is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Username is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Find room
            Room room = roomRepository.findByRoomId(request.getRoomId());
            if (room == null) {
                response.put("success", false);
                response.put("message", "Room not found");
                return ResponseEntity.badRequest().body(response);
            }

            // Check password if room has one
            if (room.getPassword() != null && !room.getPassword().isEmpty()) {
                if (request.getPassword() == null || !request.getPassword().equals(room.getPassword())) {
                    response.put("success", false);
                    response.put("message", "Invalid room password");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            System.out.println("=== ROOM JOIN SUCCESSFUL ===");

            // Create room data for response
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("roomId", room.getRoomId());
            roomData.put("roomName", room.getRoomName());
            roomData.put("createdBy", room.getCreatedBy());

            response.put("success", true);
            response.put("message", "Successfully joined room");
            response.put("room", roomData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== JOIN ROOM ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("message", "Failed to join room: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<Map<String, Object>> getRoomInfo(@PathVariable String roomId) {
        try {
            System.out.println("=== GET ROOM INFO ===");
            System.out.println("Room ID: " + roomId);

            Room room = roomRepository.findByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Room not found"));
            }

            Map<String, Object> roomData = new HashMap<>();
            roomData.put("roomId", room.getRoomId());
            roomData.put("roomName", room.getRoomName());
            roomData.put("name", room.getRoomName()); // Alternative field name
            roomData.put("createdBy", room.getCreatedBy());
            roomData.put("createdAt", room.getCreatedAt());
            roomData.put("activeUsers", 1); // Basic implementation
            roomData.put("onlineCount", 1); // Alternative field name

            return ResponseEntity.ok(roomData);

        } catch (Exception e) {
            System.err.println("=== GET ROOM INFO ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get room info"));
        }
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<?> getRoomMessages(@PathVariable String roomId) {
        try {
            System.out.println("=== GET ROOM MESSAGES ===");
            System.out.println("Room ID: " + roomId);

            // Check if room exists
            Room room = roomRepository.findByRoomId(roomId);
            if (room == null) {
                System.err.println("Room not found: " + roomId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Room not found"));
            }

            // Get messages ordered by timestamp
            List<Message> messages = messageRepository.findByRoomIdOrderByTimeStampAsc(roomId);
            System.out.println("Found " + messages.size() + " messages for room: " + roomId);

            return ResponseEntity.ok(messages);

        } catch (Exception e) {
            System.err.println("=== GET ROOM MESSAGES ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get messages"));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllRooms() {
        try {
            System.out.println("=== GET ALL ROOMS ===");

            List<Room> rooms = roomRepository.findAll();
            System.out.println("Found " + rooms.size() + " rooms");

            return ResponseEntity.ok(Map.of("rooms", rooms));

        } catch (Exception e) {
            System.err.println("=== GET ALL ROOMS ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get rooms"));
        }
    }

    @GetMapping("/users/{username}")
    public ResponseEntity<?> getUserInfo(@PathVariable String username) {
        try {
            System.out.println("=== GET USER INFO ===");
            System.out.println("Username: " + username);

            Optional<User> userOpt = userRepository.findByUsername(username);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            User user = userOpt.get();
            Map<String, Object> userData = new HashMap<>();
            userData.put("username", user.getUsername());
            userData.put("fullName", user.getFullName());
            userData.put("email", user.getEmail());

            return ResponseEntity.ok(userData);

        } catch (Exception e) {
            System.err.println("=== GET USER INFO ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get user info"));
        }
    }
}