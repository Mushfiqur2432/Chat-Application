package com.substring.chat.payload;

import lombok.Data;

@Data
public class MessagePayload {
    private String sender;
    private String roomId;
    private String content; // optional text
    private FileInfo file;  // optional file info
    private String timeStamp;

    @Data
    public static class FileInfo {
        private String url;
        private String originalName;
        private String mime;
        private long size;
        private String type;
    }
}
