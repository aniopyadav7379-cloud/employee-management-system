package com.ems.controller;

import com.ems.dto.EmployeeDTO;
import com.ems.service.AuthService;
import com.ems.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final AuthService    authService;

    public ProfileController(ProfileService profileService, AuthService authService) {
        this.profileService = profileService;
        this.authService    = authService;
    }

    /** GET /api/profile — Return the current user's profile */
    @GetMapping
    public ResponseEntity<EmployeeDTO> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.getProfile(userDetails.getUsername()));
    }

    /** PUT /api/profile — Update the current user's profile */
    @PutMapping
    public ResponseEntity<EmployeeDTO> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(profileService.updateProfile(userDetails.getUsername(), dto));
    }

    /** POST /api/profile/change-password */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        authService.changePassword(
                userDetails.getUsername(),
                body.get("currentPassword"),
                body.get("newPassword")
        );
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}
