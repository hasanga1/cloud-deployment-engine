package com.cloud.core.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class GithubService {

    private final RestTemplate restTemplate = new RestTemplate();

    public List<Map<String, String>> getCommits(String repoUrl, String branch) {
        // 1. Parse URL (e.g. https://github.com/user/repo.git -> user/repo)
        String cleanUrl = repoUrl.replace("https://github.com/", "").replace(".git", "");
        
        // 2. Build API URL
        String apiUrl = String.format("https://api.github.com/repos/%s/commits?sha=%s", cleanUrl, branch);

        // 3. Fetch Data
        try {
            Map[] response = restTemplate.getForObject(apiUrl, Map[].class);
            List<Map<String, String>> commits = new ArrayList<>();

            for (Map entry : response) {
                Map<String, Object> commitObj = (Map<String, Object>) entry.get("commit");
                String message = (String) commitObj.get("message");
                String sha = (String) entry.get("sha");
                
                // Author Info
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
            return commits;
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList(); // Handle private repos or rate limits later
        }
    }
}