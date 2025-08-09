package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.payload.MessageRequest;
import com.substring.chat.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class MessageController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageRepository messageRepository;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageRequest messageRequest) {
        try {
            System.out.println("=== RECEIVED MESSAGE ===");
            System.out.println("From: " + messageRequest.getSender());
            System.out.println("Room: " + messageRequest.getRoomId());
            System.out.println("Content: " + messageRequest.getContent());

            // Create and save message
            Message message = new Message();
            message.setSender(messageRequest.getSender());
            message.setContent(messageRequest.getContent());
            message.setRoomId(messageRequest.getRoomId());
            message.setTimeStamp(LocalDateTime.now().toString());
            message.setAttachment(messageRequest.getAttachment());

            Message savedMessage = messageRepository.save(message);

            System.out.println("=== MESSAGE SAVED ===");
            System.out.println("Message ID: " + savedMessage.getId());

            // Send to all subscribers of the room
            messagingTemplate.convertAndSend("/topic/room/" + messageRequest.getRoomId(), savedMessage);

            System.out.println("=== MESSAGE SENT TO TOPIC ===");
            System.out.println("Topic: /topic/room/" + messageRequest.getRoomId());

        } catch (Exception e) {
            System.err.println("=== MESSAGE PROCESSING ERROR ===");
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload MessageRequest messageRequest) {
        try {
            System.out.println("=== USER JOINED ROOM ===");
            System.out.println("User: " + messageRequest.getSender());
            System.out.println("Room: " + messageRequest.getRoomId());

            // Create join message
            Message joinMessage = new Message();
            joinMessage.setSender("System");
            joinMessage.setContent(messageRequest.getSender() + " joined the chat");
            joinMessage.setRoomId(messageRequest.getRoomId());
            joinMessage.setTimeStamp(LocalDateTime.now().toString());

            Message savedMessage = messageRepository.save(joinMessage);

            // Broadcast join message
            messagingTemplate.convertAndSend("/topic/room/" + messageRequest.getRoomId(), savedMessage);

            System.out.println("=== JOIN MESSAGE SENT ===");

        } catch (Exception e) {
            System.err.println("=== USER JOIN ERROR ===");
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat.leaveUser")
    public void leaveUser(@Payload MessageRequest messageRequest) {
        try {
            System.out.println("=== USER LEFT ROOM ===");
            System.out.println("User: " + messageRequest.getSender());
            System.out.println("Room: " + messageRequest.getRoomId());

            // Create leave message
            Message leaveMessage = new Message();
            leaveMessage.setSender("System");
            leaveMessage.setContent(messageRequest.getSender() + " left the chat");
            leaveMessage.setRoomId(messageRequest.getRoomId());
            leaveMessage.setTimeStamp(LocalDateTime.now().toString());

            Message savedMessage = messageRepository.save(leaveMessage);

            // Broadcast leave message
            messagingTemplate.convertAndSend("/topic/room/" + messageRequest.getRoomId(), savedMessage);

            System.out.println("=== LEAVE MESSAGE SENT ===");

        } catch (Exception e) {
            System.err.println("=== USER LEAVE ERROR ===");
            e.printStackTrace();
        }
    }
}