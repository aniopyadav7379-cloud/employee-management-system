package com.ems.dto;

import com.ems.entity.Department;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDTO {

    private Long              id;

    @NotBlank(message = "Department name is required")
    @Size(max = 100)
    private String            name;

    private String            head;
    private String            location;
    private String            description;
    private Department.Status status;
    private int               employeeCount;
    private LocalDateTime     createdAt;
    private LocalDateTime     updatedAt;
}
