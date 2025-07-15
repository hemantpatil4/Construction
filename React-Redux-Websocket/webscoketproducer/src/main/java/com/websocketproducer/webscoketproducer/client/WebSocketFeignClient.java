package com.websocketproducer.webscoketproducer.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "websocket-service", url = "http://localhost:8080")
public interface WebSocketFeignClient {

    @PostMapping("/api/push")
    void pushData(@RequestBody Map<String, Object> body);
}
