package com.websocketproducer.webscoketproducer.controller;

import com.websocketproducer.webscoketproducer.client.WebSocketFeignClient;
import com.websocketproducer.webscoketproducer.service.ProducerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/producer")
public class WebSocketProducerController {
@Autowired
public ProducerService service;

@PostMapping("/pushdata")
    public void pushDataToSocket(){
    service.sendData();
    }
}
