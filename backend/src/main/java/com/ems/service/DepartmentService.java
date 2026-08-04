package com.ems.service;

import com.ems.dto.DepartmentDTO;
import com.ems.entity.Department;
import com.ems.exception.ResourceNotFoundException;
import com.ems.mapper.EmployeeMapper;
import com.ems.repository.DepartmentRepository;
import com.ems.util.AppConstants;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository deptRepo;
    private final EmployeeMapper       mapper;

    public DepartmentService(DepartmentRepository deptRepo, EmployeeMapper mapper) {
        this.deptRepo = deptRepo;
        this.mapper   = mapper;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAll() {
        return deptRepo.findAll().stream()
                .map(mapper::toDeptDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getById(Long id) {
        return mapper.toDeptDTO(findOrThrow(id));
    }

    public DepartmentDTO create(DepartmentDTO dto) {
        if (deptRepo.existsByName(dto.getName())) {
            throw new IllegalStateException("Department name already exists: " + dto.getName());
        }
        Department entity = mapper.toDeptEntity(dto);
        return mapper.toDeptDTO(deptRepo.save(entity));
    }

    public DepartmentDTO update(Long id, DepartmentDTO dto) {
        Department entity = findOrThrow(id);

        if (deptRepo.existsByNameAndIdNot(dto.getName(), id)) {
            throw new IllegalStateException("Department name already exists: " + dto.getName());
        }

        if (dto.getName()        != null) entity.setName(dto.getName());
        if (dto.getHead()        != null) entity.setHead(dto.getHead());
        if (dto.getLocation()    != null) entity.setLocation(dto.getLocation());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getStatus()      != null) entity.setStatus(dto.getStatus());

        return mapper.toDeptDTO(deptRepo.save(entity));
    }

    public void delete(Long id) {
        Department dept = findOrThrow(id);
        if (!dept.getEmployees().isEmpty()) {
            throw new IllegalStateException(
                    "Cannot delete department with " + dept.getEmployees().size() + " employees. Reassign them first.");
        }
        deptRepo.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        List<Department> all = deptRepo.findAll();
        long total     = all.size();
        long totalEmps = all.stream().mapToLong(d -> d.getEmployees().size()).sum();

        Department largest = all.stream()
                .max((a, b) -> a.getEmployees().size() - b.getEmployees().size())
                .orElse(null);

        List<Map<String, Object>> deptList = all.stream().map(d -> Map.of(
                "id",   d.getId(),
                "name", d.getName(),
                "employeeCount", (Object) d.getEmployees().size()
        )).collect(Collectors.toList());

        return Map.of(
                "total",         total,
                "totalEmployees", totalEmps,
                "largestDept",   largest != null ? largest.getName() : "",
                "departments",   deptList
        );
    }

    private Department findOrThrow(Long id) {
        return deptRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.DEPARTMENT_NOT_FOUND + id));
    }
}
