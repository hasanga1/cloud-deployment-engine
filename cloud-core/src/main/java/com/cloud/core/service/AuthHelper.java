package com.cloud.core.service;

import com.cloud.core.entity.OrganizationMember;
import com.cloud.core.repository.OrganizationMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthHelper {

    private final OrganizationMemberRepository memberRepository;

    public AuthHelper(OrganizationMemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public Long getCurrentUserId() {
        String userIdStr = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return Long.parseLong(userIdStr);
    }

    // Check if current user is a member of the Org
    public void checkAccess(Long organizationId) {
        Long userId = getCurrentUserId();
        memberRepository.findByUserIdAndOrganizationId(userId, organizationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this Organization"));
    }
}