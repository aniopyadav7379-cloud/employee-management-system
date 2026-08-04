package com.ems.service;

import com.ems.dto.LeaveDTO;
import com.ems.entity.Employee;
import com.ems.entity.LeaveRequest;
import com.ems.entity.User;
import com.ems.exception.ResourceNotFoundException;
import com.ems.mapper.EmployeeMapper;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveRepository;
import com.ems.util.AppConstants;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveService {

    private final LeaveRepository    leaveRepo;
    private final EmployeeRepository employeeRepo;
    private final EmployeeMapper     mapper;

    public LeaveService(LeaveRepository leaveRepo,
                        EmployeeRepository employeeRepo,
                        EmployeeMapper mapper) {
        this.leaveRepo    = leaveRepo;
        this.employeeRepo = employeeRepo;
        this.mapper       = mapper;
    }

    @Transactional(readOnly = true)
    public List<LeaveDTO> getAll() {
        return leaveRepo.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(mapper::toLeaveDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeaveDTO getById(Long id) {
        return mapper.toLeaveDTO(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<LeaveDTO> getByEmployee(Long employeeId) {
        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.EMPLOYEE_NOT_FOUND + employeeId));
        return leaveRepo.findByEmployeeOrderByCreatedAtDesc(emp).stream()
                .map(mapper::toLeaveDTO)
                .collect(Collectors.toList());
    }

    public LeaveDTO create(LeaveDTO dto) {
        Employee emp = employeeRepo.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.EMPLOYEE_NOT_FOUND + dto.getEmployeeId()));

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        LeaveRequest leave = LeaveRequest.builder()
                .employee(emp)
                .leaveType(dto.getLeaveType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveRequest.Status.PENDING)
                .build();

        return mapper.toLeaveDTO(leaveRepo.save(leave));
    }

    public LeaveDTO approve(Long id, String note, User approvedBy) {
        LeaveRequest leave = findOrThrow(id);
        if (leave.getStatus() != LeaveRequest.Status.PENDING) {
            throw new IllegalStateException("Only pending leave requests can be approved.");
        }
        leave.setStatus(LeaveRequest.Status.APPROVED);
        leave.setApproverNote(note);
        leave.setApprovedBy(approvedBy);
        leave.setApprovedAt(LocalDateTime.now());
        return mapper.toLeaveDTO(leaveRepo.save(leave));
    }

    public LeaveDTO reject(Long id, String reason, User rejectedBy) {
        LeaveRequest leave = findOrThrow(id);
        if (leave.getStatus() != LeaveRequest.Status.PENDING) {
            throw new IllegalStateException("Only pending leave requests can be rejected.");
        }
        leave.setStatus(LeaveRequest.Status.REJECTED);
        leave.setRejectionReason(reason);
        leave.setApprovedBy(rejectedBy);
        leave.setApprovedAt(LocalDateTime.now());
        return mapper.toLeaveDTO(leaveRepo.save(leave));
    }

    public LeaveDTO cancel(Long id) {
        LeaveRequest leave = findOrThrow(id);
        if (leave.getStatus() == LeaveRequest.Status.APPROVED) {
            throw new IllegalStateException("Cannot cancel an already approved leave.");
        }
        leave.setStatus(LeaveRequest.Status.CANCELLED);
        return mapper.toLeaveDTO(leaveRepo.save(leave));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        long pending         = leaveRepo.countByStatus(LeaveRequest.Status.PENDING);
        long approved        = leaveRepo.countByStatus(LeaveRequest.Status.APPROVED);
        long rejected        = leaveRepo.countByStatus(LeaveRequest.Status.REJECTED);
        long onLeaveToday    = leaveRepo.findOnLeaveToday(LocalDate.now()).size();

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        long approvedMonth = leaveRepo.countSince(startOfMonth);

        return Map.of(
                "pending",       pending,
                "approved",      approved,
                "rejected",      rejected,
                "onLeaveToday",  onLeaveToday,
                "approvedMonth", approvedMonth
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBalance(Long employeeId) {
        Employee emp  = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.EMPLOYEE_NOT_FOUND + employeeId));
        int year = LocalDate.now().getYear();

        long casualUsed     = leaveRepo.countApprovedByEmployeeAndTypeAndYear(emp, LeaveRequest.LeaveType.CASUAL, year);
        long sickUsed       = leaveRepo.countApprovedByEmployeeAndTypeAndYear(emp, LeaveRequest.LeaveType.SICK,   year);
        long annualUsed     = leaveRepo.countApprovedByEmployeeAndTypeAndYear(emp, LeaveRequest.LeaveType.ANNUAL, year);

        return Map.of(
                "CASUAL",  Map.of("used", casualUsed,  "total", AppConstants.CASUAL_LEAVE_QUOTA,  "remaining", AppConstants.CASUAL_LEAVE_QUOTA - casualUsed),
                "SICK",    Map.of("used", sickUsed,    "total", AppConstants.SICK_LEAVE_QUOTA,    "remaining", AppConstants.SICK_LEAVE_QUOTA - sickUsed),
                "ANNUAL",  Map.of("used", annualUsed,  "total", AppConstants.ANNUAL_LEAVE_QUOTA,  "remaining", AppConstants.ANNUAL_LEAVE_QUOTA - annualUsed)
        );
    }

    private LeaveRequest findOrThrow(Long id) {
        return leaveRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.LEAVE_NOT_FOUND + id));
    }
}
