import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

export function connect(roomId, onMessage) {
  const socket = new SockJS("http://localhost:8080/chat");
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      stompClient.subscribe(`/topic/room/${roomId}`, (msg) => {
        if (onMessage) onMessage(JSON.parse(msg.body));
      });
    },
  });
  stompClient.activate();
}

export function sendMessage(payload) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(payload),
    });
  }
}

export function disconnect() {
  if (stompClient) stompClient.deactivate();
}
