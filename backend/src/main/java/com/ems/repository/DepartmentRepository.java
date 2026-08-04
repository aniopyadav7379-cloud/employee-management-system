package com.ems.repository;

import com.ems.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByName(String name);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);

    List<Department> findByStatus(Department.Status status);

    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.employees WHERE d.status = 'ACTIVE'")
    List<Department> findAllActiveWithEmployees();

    @Query("SELECT d FROM Department d ORDER BY SIZE(d.employees) DESC")
    List<Department> findAllOrderByEmployeeCountDesc();
}
