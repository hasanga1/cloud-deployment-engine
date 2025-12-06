package com.cloud.core.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.cloud.core.util.EncryptionUtil;

import java.util.*;

@Service
public class GithubService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final EncryptionUtil encryptionUtil;

    public GithubService(EncryptionUtil encryptionUtil) {
        this.encryptionUtil = encryptionUtil;
    }

    // UPDATE: Add 'token' parameter
    public List<Map<String, String>> getCommits(String repoUrl, String branch, String token) {
        
        // 1. Clean URL
        String cleanUrl = repoUrl.replace("https://github.com/", "").replace(".git", "");
        
        // 2. Build API URL
        String apiUrl = String.format("https://api.github.com/repos/%s/commits?sha=%s", cleanUrl, branch);

        // 3. Prepare Headers
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isEmpty()) {
            try {
                token = encryptionUtil.decrypt(token);
            } catch (Exception e) {
                System.err.println("Failed to decrypt git token");
            }
            headers.set("Authorization", "Bearer " + token);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            // 4. Make Request (Use exchange() to allow headers)
            ResponseEntity<Map[]> response = restTemplate.exchange(
                    apiUrl, 
                    HttpMethod.GET, 
                    entity, 
                    Map[].class
            );

            // 5. Parse Data
            List<Map<String, String>> commits = new ArrayList<>();
            if (response.getBody() != null) {
                for (Map entry : response.getBody()) {
                    Map<String, Object> commitObj = (Map<String, Object>) entry.get("commit");
                    String message = (String) commitObj.get("message");
                    String sha = (String) entry.get("sha");
                    
                    Map<String, Object> authorObj = (Map<String, Object>) commitObj.get("author");
                    String author = (String) authorObj.get("name");
                    String date = (String) authorObj.get("date");

                    Map<String, String> data = new HashMap<>();
                    data.put("sha", sha);
                    data.put("message", message);
                    data.put("author", author);
                    data.put("date", date);
                    commits.add(data);
                }
            }
            return commits;
        } catch (Exception e) {
            System.err.println("GitHub API Error: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}