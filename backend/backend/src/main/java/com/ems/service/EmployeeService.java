package com.ems.service;

import com.ems.dto.EmployeeDTO;
import com.ems.entity.Department;
import com.ems.entity.Employee;
import com.ems.exception.ResourceNotFoundException;
import com.ems.mapper.EmployeeMapper;
import com.ems.repository.DepartmentRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.util.AppConstants;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository   employeeRepo;
    private final DepartmentRepository deptRepo;
    private final EmployeeMapper       mapper;

    public EmployeeService(EmployeeRepository employeeRepo,
                           DepartmentRepository deptRepo,
                           EmployeeMapper mapper) {
        this.employeeRepo = employeeRepo;
        this.deptRepo     = deptRepo;
        this.mapper       = mapper;
    }

    /* ── Get All ─────────────────────────────────────────────── */
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAll() {
        return employeeRepo.findAll(Sort.by("firstName")).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> search(String q, String status, Long departmentId, int page, int size, String sortBy) {
        Employee.Status statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = Employee.Status.valueOf(status.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return employeeRepo.search(q, statusEnum, departmentId, pageable)
                .map(mapper::toDTO);
    }

    /* ── Get by ID ───────────────────────────────────────────── */
    @Transactional(readOnly = true)
    public EmployeeDTO getById(Long id) {
        return mapper.toDTO(findOrThrow(id));
    }

    /* ── Create ──────────────────────────────────────────────── */
    public EmployeeDTO create(EmployeeDTO dto) {
        if (employeeRepo.existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("Email already in use: " + dto.getEmail());
        }
        if (dto.getEmployeeId() != null && employeeRepo.existsByEmployeeId(dto.getEmployeeId())) {
            throw new IllegalStateException("Employee ID already in use: " + dto.getEmployeeId());
        }

        Employee entity = mapper.toEntity(dto);

        if (dto.getDepartmentId() != null) {
            Department dept = deptRepo.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(AppConstants.DEPARTMENT_NOT_FOUND + dto.getDepartmentId()));
            entity.setDepartment(dept);
        }

        if (dto.getManagerId() != null) {
            Employee manager = findOrThrow(dto.getManagerId());
            entity.setManager(manager);
        }

        return mapper.toDTO(employeeRepo.save(entity));
    }

    /* ── Update ──────────────────────────────────────────────── */
    public EmployeeDTO update(Long id, EmployeeDTO dto) {
        Employee entity = findOrThrow(id);

        if (dto.getEmail() != null && !dto.getEmail().equals(entity.getEmail())
                && employeeRepo.existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("Email already in use: " + dto.getEmail());
        }

        mapper.updateEntity(entity, dto);

        if (dto.getDepartmentId() != null) {
            Department dept = deptRepo.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(AppConstants.DEPARTMENT_NOT_FOUND + dto.getDepartmentId()));
            entity.setDepartment(dept);
        }

        if (dto.getManagerId() != null) {
            if (!dto.getManagerId().equals(id)) {
                Employee manager = findOrThrow(dto.getManagerId());
                entity.setManager(manager);
            }
        } else if (dto.getManagerId() == null && entity.getManager() != null) {
            entity.setManager(null);
        }

        return mapper.toDTO(employeeRepo.save(entity));
    }

    /* ── Delete ──────────────────────────────────────────────── */
    public void delete(Long id) {
        findOrThrow(id);
        employeeRepo.deleteById(id);
    }

    /* ── Recent ──────────────────────────────────────────────── */
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getRecent() {
        return employeeRepo.findRecentEmployees(PageRequest.of(0, 8)).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    /* ── Stats ───────────────────────────────────────────────── */
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        long total    = employeeRepo.count();
        long active   = employeeRepo.countByStatus(Employee.Status.ACTIVE);
        long inactive = total - active;
        long newThisMonth = employeeRepo.countJoinedSince(LocalDate.now().withDayOfMonth(1));

        return Map.of(
                "total",    total,
                "active",   active,
                "inactive", inactive,
                "newThisMonth", newThisMonth
        );
    }

    private Employee findOrThrow(Long id) {
        return employeeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.EMPLOYEE_NOT_FOUND + id));
    }
}
