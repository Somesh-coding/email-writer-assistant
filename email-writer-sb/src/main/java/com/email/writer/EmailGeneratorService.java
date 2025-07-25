package com.email.writer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;
    private final String apiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder,
                                 @Value("${gemini.api.url}") String baseUrl,
                                 @Value("${gemini.api.key}") String geminiApiKey) {
        this.apiKey = geminiApiKey;
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        try {
            // 1. Build safe prompt
            String prompt = buildPrompt(emailRequest);

            // 2. Build JSON body using ObjectMapper
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode requestJson = mapper.createObjectNode();

            ObjectNode part = mapper.createObjectNode();
            part.put("text", prompt);

            ArrayNode parts = mapper.createArrayNode().add(part);
            ObjectNode content = mapper.createObjectNode();
            content.set("parts", parts);

            ArrayNode contents = mapper.createArrayNode().add(content);
            requestJson.set("contents", contents);

            // 3. Send request to Gemini API
            String response = webClient.post()
                    .uri("/v1beta/models/gemini-2.5-flash:generateContent")
                    .header("x-goog-api-key", apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .bodyValue(mapper.writeValueAsString(requestJson))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("Raw API response:\n" + response);

            // 4. Parse response
            return extractResponseContent(response);
        } catch (Exception e) {
            e.printStackTrace();
            return "Error generating reply: " + e.getMessage();
        }
    }

    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            JsonNode candidates = root.path("candidates");

            if (candidates.isArray() && candidates.size() > 0) {
                return candidates.get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text")
                        .asText();
            } else {
                return "No response received from Gemini API.";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Failed to parse Gemini API response: " + e.getMessage();
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder("Generate a professional email reply for the following email:\n");

        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            prompt.append("Use a ").append(emailRequest.getTone()).append(" tone.\n");
        }

        prompt.append("Original Email:\n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }
}
