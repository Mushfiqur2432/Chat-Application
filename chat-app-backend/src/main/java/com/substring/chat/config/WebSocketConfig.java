package com.substring.chat.config;

import com.substring.chat.services.JwtUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    public WebSocketConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");

        System.out.println("=== WEBSOCKET MESSAGE BROKER CONFIGURED ===");
        System.out.println("Simple broker enabled for: /topic");
        System.out.println("Application destination prefix: /app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        System.out.println("=== WEBSOCKET STOMP ENDPOINT REGISTERED ===");
        System.out.println("Endpoint: /ws");
        System.out.println("Allowed origins: *");
        System.out.println("SockJS enabled: true");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);

                        try {
                            if (jwtUtil.validateToken(token)) {
                                String username = jwtUtil.getUsernameFromToken(token);

                                // Create a principal for the authenticated user
                                Principal principal = () -> username;
                                accessor.setUser(principal);

                                System.out.println("WebSocket authenticated user: " + username);
                            } else {
                                System.err.println("Invalid JWT token for WebSocket connection");
                                throw new IllegalArgumentException("Invalid JWT token");
                            }
                        } catch (Exception e) {
                            System.err.println("WebSocket authentication failed: " + e.getMessage());
                            throw new IllegalArgumentException("Authentication failed");
                        }
                    } else {
                        System.err.println("No Authorization header found for WebSocket connection");
                        throw new IllegalArgumentException("Missing Authorization header");
                    }
                }

                return message;
            }
        });
    }
}