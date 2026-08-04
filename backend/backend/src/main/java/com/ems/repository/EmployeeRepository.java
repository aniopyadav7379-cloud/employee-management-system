package com.ems.repository;

import com.ems.entity.Department;
import com.ems.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByEmployeeId(String employeeId);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);

    List<Employee> findByDepartment(Department department);
    List<Employee> findByStatus(Employee.Status status);
    List<Employee> findByDepartmentAndStatus(Department department, Employee.Status status);

    @Query("SELECT e FROM Employee e WHERE e.status = 'ACTIVE' ORDER BY e.createdAt DESC")
    List<Employee> findRecentEmployees(Pageable pageable);

    @Query("""
        SELECT e FROM Employee e
        WHERE (:q IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
            OR LOWER(e.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
            OR LOWER(e.email)     LIKE LOWER(CONCAT('%',:q,'%'))
            OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%',:q,'%')))
        AND (:status IS NULL OR e.status = :status)
        AND (:departmentId IS NULL OR e.department.id = :departmentId)
        ORDER BY e.firstName ASC
        """)
    Page<Employee> search(
        @Param("q") String q,
        @Param("status") Employee.Status status,
        @Param("departmentId") Long departmentId,
        Pageable pageable
    );

    long countByStatus(Employee.Status status);
    long countByDepartment(Department department);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.joinDate >= :from")
    long countJoinedSince(@Param("from") LocalDate from);
}
