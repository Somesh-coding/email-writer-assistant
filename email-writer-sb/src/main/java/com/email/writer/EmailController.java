package com.email.writer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailGeneratorService emailService;

    @Autowired
    public EmailController(EmailGeneratorService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/generate")
    public String generateReply(@RequestBody EmailRequest request) {
        return emailService.generateEmailReply(request);
    }
}
