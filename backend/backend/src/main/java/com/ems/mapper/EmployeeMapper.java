package com.ems.mapper;

import com.ems.dto.DepartmentDTO;
import com.ems.dto.EmployeeDTO;
import com.ems.dto.LeaveDTO;
import com.ems.entity.Department;
import com.ems.entity.Employee;
import com.ems.entity.LeaveRequest;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper {

    /* ── Employee ────────────────────────────────────────────── */

    public EmployeeDTO toDTO(Employee e) {
        if (e == null) return null;
        return EmployeeDTO.builder()
                .id(e.getId())
                .employeeId(e.getEmployeeId())
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .email(e.getEmail())
                .phone(e.getPhone())
                .dob(e.getDob())
                .gender(e.getGender())
                .address(e.getAddress())
                .designation(e.getDesignation())
                .employmentType(e.getEmploymentType())
                .joinDate(e.getJoinDate())
                .status(e.getStatus())
                .salary(e.getSalary())
                .emergencyContactName(e.getEmergencyContactName())
                .emergencyContactPhone(e.getEmergencyContactPhone())
                .notes(e.getNotes())
                .photoUrl(e.getPhotoUrl())
                .departmentId(e.getDepartment() != null ? e.getDepartment().getId()   : null)
                .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                .managerId(e.getManager() != null ? e.getManager().getId()   : null)
                .managerName(e.getManager() != null ? e.getManager().getFullName() : null)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    public Employee toEntity(EmployeeDTO dto) {
        if (dto == null) return null;
        return Employee.builder()
                .employeeId(dto.getEmployeeId())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .dob(dto.getDob())
                .gender(dto.getGender())
                .address(dto.getAddress())
                .designation(dto.getDesignation())
                .employmentType(dto.getEmploymentType() != null
                        ? dto.getEmploymentType() : Employee.EmploymentType.FULL_TIME)
                .joinDate(dto.getJoinDate())
                .status(dto.getStatus() != null ? dto.getStatus() : Employee.Status.ACTIVE)
                .salary(dto.getSalary())
                .emergencyContactName(dto.getEmergencyContactName())
                .emergencyContactPhone(dto.getEmergencyContactPhone())
                .notes(dto.getNotes())
                .build();
    }

    public void updateEntity(Employee entity, EmployeeDTO dto) {
        if (dto.getFirstName()            != null) entity.setFirstName(dto.getFirstName());
        if (dto.getLastName()             != null) entity.setLastName(dto.getLastName());
        if (dto.getEmail()                != null) entity.setEmail(dto.getEmail());
        if (dto.getPhone()                != null) entity.setPhone(dto.getPhone());
        if (dto.getDob()                  != null) entity.setDob(dto.getDob());
        if (dto.getGender()               != null) entity.setGender(dto.getGender());
        if (dto.getAddress()              != null) entity.setAddress(dto.getAddress());
        if (dto.getDesignation()          != null) entity.setDesignation(dto.getDesignation());
        if (dto.getEmploymentType()       != null) entity.setEmploymentType(dto.getEmploymentType());
        if (dto.getJoinDate()             != null) entity.setJoinDate(dto.getJoinDate());
        if (dto.getStatus()               != null) entity.setStatus(dto.getStatus());
        if (dto.getSalary()               != null) entity.setSalary(dto.getSalary());
        if (dto.getEmergencyContactName() != null) entity.setEmergencyContactName(dto.getEmergencyContactName());
        if (dto.getEmergencyContactPhone()!= null) entity.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        if (dto.getNotes()                != null) entity.setNotes(dto.getNotes());
    }

    /* ── Department ─────────────────────────────────────────── */

    public DepartmentDTO toDeptDTO(Department d) {
        if (d == null) return null;
        return DepartmentDTO.builder()
                .id(d.getId())
                .name(d.getName())
                .head(d.getHead())
                .location(d.getLocation())
                .description(d.getDescription())
                .status(d.getStatus())
                .employeeCount(d.getEmployees() != null ? d.getEmployees().size() : 0)
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public Department toDeptEntity(DepartmentDTO dto) {
        if (dto == null) return null;
        return Department.builder()
                .name(dto.getName())
                .head(dto.getHead())
                .location(dto.getLocation())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : Department.Status.ACTIVE)
                .build();
    }

    /* ── Leave ──────────────────────────────────────────────── */

    public LeaveDTO toLeaveDTO(LeaveRequest l) {
        if (l == null) return null;
        Employee emp = l.getEmployee();
        return LeaveDTO.builder()
                .id(l.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeFirstName(emp != null ? emp.getFirstName() : null)
                .employeeLastName(emp != null ? emp.getLastName()  : null)
                .employeeDesignation(emp != null ? emp.getDesignation() : null)
                .departmentName(emp != null && emp.getDepartment() != null
                        ? emp.getDepartment().getName() : null)
                .leaveType(l.getLeaveType())
                .startDate(l.getStartDate())
                .endDate(l.getEndDate())
                .reason(l.getReason())
                .status(l.getStatus())
                .rejectionReason(l.getRejectionReason())
                .approverNote(l.getApproverNote())
                .appliedOn(l.getCreatedAt())
                .approvedAt(l.getApprovedAt())
                .build();
    }
}
