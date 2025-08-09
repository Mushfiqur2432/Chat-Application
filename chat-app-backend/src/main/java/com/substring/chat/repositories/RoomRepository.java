package com.substring.chat.repositories;

import com.substring.chat.entities.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {
    Room findByRoomId(String roomId);
    boolean existsByRoomId(String roomId);
    boolean existsByRoomName(String roomName);
}