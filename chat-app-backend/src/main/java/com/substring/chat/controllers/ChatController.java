package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.payload.MessageRequest;
import com.substring.chat.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sendMessage/{roomId}")
    public void sendMessage(@DestinationVariable String roomId, MessageRequest messageRequest) {
        try {
            System.out.println("=== RECEIVED MESSAGE FOR ROOM: " + roomId + " ===");
            System.out.println("Message Request: " + messageRequest);

            // Create Message entity from request
            Message message = new Message();
            message.setSender(messageRequest.getSender());
            message.setContent(messageRequest.getContent());
            message.setRoomId(roomId);
            message.setTimeStamp(messageRequest.getTimeStamp() != null ?
                    messageRequest.getTimeStamp() : LocalDateTime.now().toString());
            message.setAttachment(messageRequest.getAttachment());

            System.out.println("Created message entity: " + message);

            // Save message to MongoDB
            Message savedMessage = messageRepository.save(message);
            System.out.println("=== MESSAGE SAVED TO DATABASE ===");
            System.out.println("Saved message ID: " + savedMessage.getId());

            // Broadcast message to all subscribers of this room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, savedMessage);
            System.out.println("=== MESSAGE BROADCASTED TO: /topic/room/" + roomId + " ===");

        } catch (Exception e) {
            System.err.println("=== ERROR PROCESSING MESSAGE ===");
            System.err.println("Room ID: " + roomId);
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/sendMessage")
    public void sendMessageAlternative(MessageRequest messageRequest) {
        try {
            System.out.println("=== RECEIVED MESSAGE (ALTERNATIVE ENDPOINT) ===");
            System.out.println("Message Request: " + messageRequest);

            // Create Message entity from request
            Message message = new Message();
            message.setSender(messageRequest.getSender());
            message.setContent(messageRequest.getContent());
            message.setRoomId(messageRequest.getRoomId());
            message.setTimeStamp(messageRequest.getTimeStamp() != null ?
                    messageRequest.getTimeStamp() : LocalDateTime.now().toString());
            message.setAttachment(messageRequest.getAttachment());

            System.out.println("Created message entity: " + message);

            // Save message to MongoDB
            Message savedMessage = messageRepository.save(message);
            System.out.println("=== MESSAGE SAVED TO DATABASE ===");
            System.out.println("Saved message ID: " + savedMessage.getId());

            // Broadcast message to all subscribers of this room
            messagingTemplate.convertAndSend("/topic/room/" + messageRequest.getRoomId(), savedMessage);
            System.out.println("=== MESSAGE BROADCASTED TO: /topic/room/" + messageRequest.getRoomId() + " ===");

        } catch (Exception e) {
            System.err.println("=== ERROR PROCESSING MESSAGE (ALTERNATIVE) ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}