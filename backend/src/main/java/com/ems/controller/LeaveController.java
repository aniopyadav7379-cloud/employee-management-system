package com.ems.controller;

import com.ems.dto.LeaveDTO;
import com.ems.entity.User;
import com.ems.service.AuthService;
import com.ems.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService  leaveService;
    private final AuthService   authService;

    public LeaveController(LeaveService leaveService, AuthService authService) {
        this.leaveService = leaveService;
        this.authService  = authService;
    }

    @GetMapping
    public ResponseEntity<List<LeaveDTO>> getAll() {
        return ResponseEntity.ok(leaveService.getAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(leaveService.getStats());
    }

    @GetMapping("/my")
    public ResponseEntity<List<LeaveDTO>> getMy(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        if (user.getEmployee() == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(leaveService.getByEmployee(user.getEmployee().getId()));
    }

    @GetMapping("/balance/{employeeId}")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getBalance(employeeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(leaveService.getById(id));
    }

    @PostMapping
    public ResponseEntity<LeaveDTO> create(@Valid @RequestBody LeaveDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveService.create(dto));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<LeaveDTO> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(leaveService.approve(id, note, user));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<LeaveDTO> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(leaveService.reject(id, reason, user));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<LeaveDTO> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(leaveService.cancel(id));
    }
}
