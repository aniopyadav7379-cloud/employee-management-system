package com.ems.dto;

import com.ems.entity.LeaveRequest;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveDTO {

    private Long                  id;

    @NotNull(message = "Employee is required")
    private Long                  employeeId;

    private String                employeeFirstName;
    private String                employeeLastName;
    private String                employeeDesignation;
    private String                departmentName;

    @NotNull(message = "Leave type is required")
    private LeaveRequest.LeaveType leaveType;

    @NotNull(message = "Start date is required")
    private LocalDate             startDate;

    @NotNull(message = "End date is required")
    private LocalDate             endDate;

    @NotBlank(message = "Reason is required")
    @Size(max = 500)
    private String                reason;

    private LeaveRequest.Status   status;
    private String                rejectionReason;
    private String                approverNote;
    private LocalDateTime         appliedOn;
    private LocalDateTime         approvedAt;
}
