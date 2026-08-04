package com.ems.dto;

import com.ems.entity.Employee;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {

    private Long   id;

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "First name is required")
    @Size(max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    private String email;

    @Pattern(regexp = "^[+]?[0-9 \\-()]{7,20}$", message = "Enter a valid phone number")
    private String phone;

    private LocalDate dob;
    private Employee.Gender         gender;
    private String                  address;

    @NotBlank(message = "Designation is required")
    private String designation;

    private Employee.EmploymentType employmentType;

    @NotNull(message = "Join date is required")
    private LocalDate joinDate;

    private Employee.Status         status;
    private BigDecimal              salary;
    private String                  emergencyContactName;
    private String                  emergencyContactPhone;
    private String                  notes;
    private String                  photoUrl;

    // Relations (read)
    private Long                    departmentId;
    private String                  departmentName;
    private Long                    managerId;
    private String                  managerName;

    private LocalDateTime           createdAt;
    private LocalDateTime           updatedAt;
}
