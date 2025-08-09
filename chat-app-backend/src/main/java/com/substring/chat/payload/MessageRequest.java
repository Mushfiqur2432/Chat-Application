package com.substring.chat.payload;

public class MessageRequest {
    private String sender;
    private String content;
    private String roomId;
    private String timeStamp;
    private Object attachment;

    // Default constructor
    public MessageRequest() {}

    // Constructor with parameters
    public MessageRequest(String sender, String content, String roomId, String timeStamp, Object attachment) {
        this.sender = sender;
        this.content = content;
        this.roomId = roomId;
        this.timeStamp = timeStamp;
        this.attachment = attachment;
    }

    // Getters and Setters
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

    @Override
    public String toString() {
        return "MessageRequest{" +
                "sender='" + sender + '\'' +
                ", content='" + content + '\'' +
                ", roomId='" + roomId + '\'' +
                ", timeStamp='" + timeStamp + '\'' +
                ", attachment=" + attachment +
                '}';
    }
}