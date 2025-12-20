package com.cloud.core.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthUserResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
}