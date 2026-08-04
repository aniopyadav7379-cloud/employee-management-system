package com.ems.dto;

import com.ems.entity.Employee;
import com.ems.entity.LeaveRequest;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// ─────────────────────────────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────────────────────────────

class AuthDTOs {} // namespace marker

record LoginRequestDTO(
    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    String email,

    @NotBlank(message = "Password is required")
    String password
) {}

record LoginResponseDTO(
    String token,
    String type,
    Long userId,
    String name,
    String email,
    String role
) {
    public static LoginResponseDTO of(String token, Long userId, String name, String email, String role) {
        return new LoginResponseDTO(token, "Bearer", userId, name, email, role);
    }
}
