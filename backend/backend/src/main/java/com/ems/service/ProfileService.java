package com.ems.service;

import com.ems.dto.EmployeeDTO;
import com.ems.entity.Employee;
import com.ems.entity.User;
import com.ems.mapper.EmployeeMapper;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class ProfileService {

    private final UserRepository     userRepo;
    private final EmployeeRepository employeeRepo;
    private final EmployeeMapper     mapper;

    public ProfileService(UserRepository userRepo,
                          EmployeeRepository employeeRepo,
                          EmployeeMapper mapper) {
        this.userRepo     = userRepo;
        this.employeeRepo = employeeRepo;
        this.mapper       = mapper;
    }

    /**
     * Get profile for the currently logged-in user.
     * If the user has a linked employee record, return that; otherwise return basic user info.
     */
    @Transactional(readOnly = true)
    public EmployeeDTO getProfile(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        if (user.getEmployee() != null) {
            return mapper.toDTO(user.getEmployee());
        }

        // Build a minimal DTO from user record for admin users without employee records
        return EmployeeDTO.builder()
                .id(user.getId())
                .firstName(user.getName().split(" ")[0])
                .lastName(user.getName().contains(" ") ? user.getName().split(" ", 2)[1] : "")
                .email(user.getEmail())
                .designation(user.getRole().name())
                .build();
    }

    /**
     * Update the profile for the currently logged-in user.
     */
    public EmployeeDTO updateProfile(String email, EmployeeDTO dto) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        // Update the user's name
        if (dto.getFirstName() != null && dto.getLastName() != null) {
            user.setName(dto.getFirstName() + " " + dto.getLastName());
            userRepo.save(user);
        }

        if (user.getEmployee() != null) {
            Employee emp = user.getEmployee();
            mapper.updateEntity(emp, dto);
            employeeRepo.save(emp);
            return mapper.toDTO(emp);
        }

        // No linked employee – return updated basic profile
        return getProfile(email);
    }
}
