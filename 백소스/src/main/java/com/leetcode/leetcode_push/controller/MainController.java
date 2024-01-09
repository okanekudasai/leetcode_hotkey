package com.leetcode.leetcode_push.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonParser;
import com.leetcode.leetcode_push.dto.CodeDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@CrossOrigin("*")
public class MainController {
    ObjectMapper mapper = new ObjectMapper();
    JsonParser parser = new JsonParser();

    @Value("${secret.client_id}")
    private String clientId;
    @Value("${secret.client_secret}")
    private String clientSecret;
    @GetMapping("/codeToToken/{code}")
    String codeToToken(@PathVariable("code") String code) {
        WebClient webClient = WebClient.builder().build();
        String url = "https://github.com/login/oauth/access_token";
        CodeDto request_body = CodeDto.builder()
                        .client_id(clientId)
                        .client_secret(clientSecret)
                        .code(code).build();

        String res = webClient.post()
                .uri("https://github.com/login/oauth/access_token")
                .bodyValue(request_body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        String [] r = res.split("[=&]");
        if (r[0].equals("access_token")) {
            return r[1];
        }
        return "error";
    }
}
