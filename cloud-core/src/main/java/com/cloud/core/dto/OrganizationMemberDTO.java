package com.cloud.core.dto;

import com.cloud.core.entity.MemberRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationMemberDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private MemberRole role;
}