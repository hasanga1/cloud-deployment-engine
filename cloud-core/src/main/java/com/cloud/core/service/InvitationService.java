package com.cloud.core.service;

import com.cloud.core.dto.OrganizationMemberDTO;
import com.cloud.core.entity.*;
import com.cloud.core.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepo;
    private final OrganizationRepository orgRepo;
    private final OrganizationMemberRepository memberRepo;
    private final JavaMailSender mailSender;
    private final AuthServiceClient authServiceClient; // To verify user email
    private final AuthHelper authHelper;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public InvitationService(InvitationRepository invitationRepo, OrganizationRepository orgRepo, OrganizationMemberRepository memberRepo, JavaMailSender mailSender, AuthServiceClient authServiceClient, AuthHelper authHelper) {
        this.invitationRepo = invitationRepo;
        this.orgRepo = orgRepo;
        this.memberRepo = memberRepo;
        this.mailSender = mailSender;
        this.authServiceClient = authServiceClient;
        this.authHelper = authHelper;
    }

    // 1. Send Invitation
    public void sendInvitation(Long orgId, String email, MemberRole role) {
        // A. Security Check (Must be Org Member)
        authHelper.checkAccess(orgId);
        
        Organization org = orgRepo.findById(orgId).orElseThrow();

        // B. Create Token
        OrganizationInvitation invite = new OrganizationInvitation();
        invite.setOrganization(org);
        invite.setEmail(email);
        invite.setRole(role);
        invite.setExpiryDate(LocalDateTime.now().plusHours(48));
        
        // Save to generate UUID
        invite = invitationRepo.save(invite);

        // C. Send Email
        String inviteUrl = frontendUrl + "/join?token=" + invite.getToken();
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Invitation to join " + org.getName());
        message.setText("You have been invited to join the organization '" + org.getName() + "'.\n\n" +
                "Click here to accept: " + inviteUrl + "\n\n" +
                "This link is valid for 48 hours.");
        
        mailSender.send(message);
    }

    // 2. Accept Invitation
    public void acceptInvitation(String token) {
        // A. Validate Token
        OrganizationInvitation invite = invitationRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid Invitation Token"));

        if (invite.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invitation has expired");
        }

        // B. Get Current User Details
        Long currentUserId = authHelper.getCurrentUserId();
        
        // C. 🚨 SECURITY CRITICAL: Fetch User Email from Auth Service
        Map<Long, OrganizationMemberDTO> userMap = authServiceClient.fetchUsers(Collections.singletonList(currentUserId));
        OrganizationMemberDTO userDetails = userMap.get(currentUserId);
        
        if (userDetails == null) {
            throw new RuntimeException("User details not found");
        }

        // D. 🚨 Compare Emails (The "Lock")
        if (!userDetails.getEmail().equalsIgnoreCase(invite.getEmail())) {
            throw new RuntimeException("This invitation is for " + invite.getEmail() + ", but you are logged in as " + userDetails.getEmail());
        }

        // E. Add Member
        OrganizationMember member = new OrganizationMember();
        member.setOrganization(invite.getOrganization());
        member.setUserId(currentUserId);
        member.setRole(invite.getRole());
        
        // Prevent duplicate joins
        if (memberRepo.findByUserIdAndOrganizationId(currentUserId, invite.getOrganization().getId()).isEmpty()) {
            memberRepo.save(member);
        }

        // F. Delete Invitation (One-time use)
        invitationRepo.delete(invite);
    }
}