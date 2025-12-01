package com.cloud.core.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class LogConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    public LogConsumer(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Listens to the logs sent by the Orchestrator
    @KafkaListener(topics = "deployment-logs", groupId = "core-log-consumer")
    public void consumeLogs(String logMessage) {
        System.out.println("LOG FORWARDING: " + logMessage);
        
        // Push to WebSocket topic
        // In a real app, you'd parse the log to find the Deployment ID and send to /topic/logs/{id}
        // For now, we broadcast to everyone on /topic/logs
        messagingTemplate.convertAndSend("/topic/logs", logMessage);
    }
}