package com.ems.controller;

import com.ems.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/headcount")
    public ResponseEntity<Map<String, Object>> getHeadcount(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(dashboardService.getHeadcountTrend(period));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity() {
        return ResponseEntity.ok(dashboardService.getRecentActivity());
    }
}
