package com.ems.repository;

import com.ems.entity.Employee;
import com.ems.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployee(Employee employee);
    List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);
    List<LeaveRequest> findByStatus(LeaveRequest.Status status);

    Page<LeaveRequest> findByStatus(LeaveRequest.Status status, Pageable pageable);

    @Query("""
        SELECT l FROM LeaveRequest l
        WHERE l.status = 'APPROVED'
        AND l.startDate <= :today
        AND l.endDate >= :today
        """)
    List<LeaveRequest> findOnLeaveToday(@Param("today") LocalDate today);

    @Query("""
        SELECT COUNT(l) FROM LeaveRequest l
        WHERE l.employee = :emp
        AND l.leaveType = :type
        AND l.status = 'APPROVED'
        AND YEAR(l.startDate) = :year
        """)
    long countApprovedByEmployeeAndTypeAndYear(
        @Param("emp")  Employee emp,
        @Param("type") LeaveRequest.LeaveType type,
        @Param("year") int year
    );

    long countByStatus(LeaveRequest.Status status);

    @Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.status IN ('APPROVED','PENDING') AND l.createdAt >= :from")
    long countSince(@Param("from") LocalDateTime from);

    @Query("""
        SELECT l FROM LeaveRequest l
        JOIN FETCH l.employee e
        WHERE (:status IS NULL OR l.status = :status)
        AND   (:leaveType IS NULL OR l.leaveType = :leaveType)
        ORDER BY l.createdAt DESC
        """)
    Page<LeaveRequest> findAllFiltered(
        @Param("status")    LeaveRequest.Status    status,
        @Param("leaveType") LeaveRequest.LeaveType leaveType,
        Pageable pageable
    );
}
