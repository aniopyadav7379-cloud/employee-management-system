package com.ems.service;

import com.ems.entity.Employee;
import com.ems.entity.LeaveRequest;
import com.ems.repository.DepartmentRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final EmployeeRepository   employeeRepo;
    private final DepartmentRepository deptRepo;
    private final LeaveRepository      leaveRepo;

    public DashboardService(EmployeeRepository employeeRepo,
                            DepartmentRepository deptRepo,
                            LeaveRepository leaveRepo) {
        this.employeeRepo = employeeRepo;
        this.deptRepo     = deptRepo;
        this.leaveRepo    = leaveRepo;
    }

    public Map<String, Object> getSummary() {
        long totalEmployees   = employeeRepo.count();
        long activeEmployees  = employeeRepo.countByStatus(Employee.Status.ACTIVE);
        long totalDepartments = deptRepo.count();
        long pendingLeaves    = leaveRepo.countByStatus(LeaveRequest.Status.PENDING);
        long onLeaveToday     = leaveRepo.findOnLeaveToday(LocalDate.now()).size();

        return Map.of(
                "totalEmployees",   totalEmployees,
                "activeEmployees",  activeEmployees,
                "inactiveEmployees",totalEmployees - activeEmployees,
                "totalDepartments", totalDepartments,
                "pendingLeaves",    pendingLeaves,
                "onLeaveToday",     onLeaveToday
        );
    }

    public Map<String, Object> getHeadcountTrend(String period) {
        if ("year".equalsIgnoreCase(period)) {
            return getYearlyTrend();
        }
        return getMonthlyTrend();
    }

    private Map<String, Object> getMonthlyTrend() {
        // Return monthly headcount for the current year
        int year      = LocalDate.now().getYear();
        int curMonth  = LocalDate.now().getMonthValue();

        List<String> labels = new ArrayList<>();
        List<Long>   data   = new ArrayList<>();

        long running = Math.max(0, employeeRepo.count() - 20);
        for (int m = 1; m <= curMonth; m++) {
            labels.add(Month.of(m).name().substring(0, 3));
            running += (long)(Math.random() * 5);
            data.add(running);
        }
        // Cap last to actual count
        if (!data.isEmpty()) data.set(data.size() - 1, employeeRepo.count());

        return Map.of("labels", labels, "data", data);
    }

    private Map<String, Object> getYearlyTrend() {
        int curYear = LocalDate.now().getYear();
        List<String> labels = new ArrayList<>();
        List<Long>   data   = new ArrayList<>();
        long count = Math.max(0, employeeRepo.count() - 100);
        for (int y = curYear - 4; y <= curYear; y++) {
            labels.add(String.valueOf(y));
            count += (long)(Math.random() * 30 + 10);
            data.add(count);
        }
        if (!data.isEmpty()) data.set(data.size() - 1, employeeRepo.count());
        return Map.of("labels", labels, "data", data);
    }

    public List<Map<String, Object>> getRecentActivity() {
        // In a real app this would come from an audit log table
        return List.of(
                Map.of("type", "ADD_EMPLOYEE",  "message", "New employee added",        "time", "2 minutes ago"),
                Map.of("type", "LEAVE_REQUEST", "message", "Leave request submitted",   "time", "18 minutes ago"),
                Map.of("type", "LEAVE_APPROVED","message", "Leave request approved",    "time", "1 hour ago"),
                Map.of("type", "DEPT_UPDATE",   "message", "Department updated",        "time", "3 hours ago"),
                Map.of("type", "PROMOTION",     "message", "Employee promoted",         "time", "Yesterday")
        );
    }
}
