package com.websocket.demo.controller;

import com.websocket.demo.service.RawSocketBroadcaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PushReceiverController {

    @Autowired
    private RawSocketBroadcaster broadcaster;

    @PostMapping("/push")
    public ResponseEntity<?> receiveData(@RequestBody Map<String, Object> body) {
        Object value = body.get("value");
        broadcaster.broadcast("🎲 Value: " + value);
        return ResponseEntity.ok().build();
    }
}
