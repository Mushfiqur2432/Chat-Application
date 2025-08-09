package com.substring.chat.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.CreatedDate;
import java.time.LocalDateTime;

@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String sender;
    private String content;
    private String roomId;
    private String timeStamp;
    private Object attachment;

    // Enhanced file support fields
    private String fileUrl;
    private String fileType;
    private String fileName;
    private String originalFileName;
    private Long fileSize;
    private String senderFullName;

    // Message type to distinguish between text, file, image, etc.
    private String messageType; // "text", "image", "video", "audio", "document"

    @CreatedDate
    private LocalDateTime createdAt;

    // Default constructor
    public Message() {
        this.createdAt = LocalDateTime.now();
        this.messageType = "text"; // default type
    }

    // Constructor with basic parameters
    public Message(String sender, String content, String roomId, String timeStamp) {
        this.sender = sender;
        this.content = content;
        this.roomId = roomId;
        this.timeStamp = timeStamp;
        this.createdAt = LocalDateTime.now();
        this.messageType = "text";
    }

    // Constructor with file support
    public Message(String sender, String content, String roomId, String timeStamp,
                   String fileUrl, String fileType, String fileName, String originalFileName, Long fileSize) {
        this.sender = sender;
        this.content = content;
        this.roomId = roomId;
        this.timeStamp = timeStamp;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileSize = fileSize;
        this.createdAt = LocalDateTime.now();
        this.messageType = determineMessageType(fileType);
    }

    // Helper method to determine message type based on file type
    private String determineMessageType(String fileType) {
        if (fileType == null) return "text";

        if (fileType.startsWith("image/")) return "image";
        if (fileType.startsWith("video/")) return "video";
        if (fileType.startsWith("audio/")) return "audio";
        return "document";
    }

    // All getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(String timeStamp) {
        this.timeStamp = timeStamp;
    }

    public Object getAttachment() {
        return attachment;
    }

    public void setAttachment(Object attachment) {
        this.attachment = attachment;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
        this.messageType = determineMessageType(fileType);
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getSenderFullName() {
        return senderFullName;
    }

    public void setSenderFullName(String senderFullName) {
        this.senderFullName = senderFullName;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Message{" +
                "id='" + id + '\'' +
                ", sender='" + sender + '\'' +
                ", content='" + content + '\'' +
                ", roomId='" + roomId + '\'' +
                ", timeStamp='" + timeStamp + '\'' +
                ", messageType='" + messageType + '\'' +
                ", fileUrl='" + fileUrl + '\'' +
                ", fileType='" + fileType + '\'' +
                ", fileName='" + fileName + '\'' +
                ", originalFileName='" + originalFileName + '\'' +
                ", fileSize=" + fileSize +
                ", senderFullName='" + senderFullName + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}