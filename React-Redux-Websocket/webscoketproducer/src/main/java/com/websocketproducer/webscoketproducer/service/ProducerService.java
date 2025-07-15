package com.websocketproducer.webscoketproducer.service;

import com.websocketproducer.webscoketproducer.client.WebSocketFeignClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ProducerService {

    @Autowired
    private WebSocketFeignClient client;

    @Scheduled(fixedRate = 2000)
    public void sendData() {
        int value = (int) (Math.random() * 100);
        client.pushData(Map.of("value", value));
        System.out.println("🚀 Sent value: " + value);
    }
}