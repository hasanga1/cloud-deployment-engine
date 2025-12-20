package com.cloud.core.service;

import com.cloud.core.dto.AuthUserResponseDTO;
import com.cloud.core.dto.OrganizationMemberDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.auth-service.url:http://localhost:9000}")
    private String authServiceUrl;

    public Map<Long, OrganizationMemberDTO> fetchUsers(List<Long> userIds) {
        if (userIds.isEmpty()) return Collections.emptyMap();

        try {
            String url = authServiceUrl + "/auth/users/batch";
            
            // Call Auth Service
            ResponseEntity<AuthUserResponseDTO[]> response = restTemplate.postForEntity(
                    url, 
                    userIds, 
                    AuthUserResponseDTO[].class
            );

            if (response.getBody() == null) return Collections.emptyMap();

            // Convert List to Map for easy lookup: {userId -> UserDetails}
            return Arrays.stream(response.getBody())
                .collect(Collectors.toMap(
                    AuthUserResponseDTO::getId,
                    authUser -> {
                        OrganizationMemberDTO dto = new OrganizationMemberDTO();
                        dto.setUserId(authUser.getId());
                        dto.setFirstName(authUser.getFirstName());
                        dto.setLastName(authUser.getLastName());
                        dto.setEmail(authUser.getEmail());
                        dto.setRole(null);
                        return dto;
                    }
                ));

        } catch (Exception e) {
            System.err.println("Failed to fetch user details: " + e.getMessage());
            return Collections.emptyMap();
        }
    }
}