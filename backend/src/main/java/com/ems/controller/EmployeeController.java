package com.ems.controller;

import com.ems.dto.EmployeeDTO;
import com.ems.service.EmployeeService;
import com.ems.util.AppConstants;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /* ── GET /api/employees ──────────────────────────────────── */
    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAll(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long   departmentId,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "50")  int size,
            @RequestParam(defaultValue = "firstName") String sortBy
    ) {
        if (q == null && status == null && departmentId == null && page == 0 && size >= 50) {
            // Simple full list (for dropdowns, grids, etc.)
            return ResponseEntity.ok(employeeService.getAll());
        }
        Page<EmployeeDTO> result = employeeService.search(q, status, departmentId, page, size, sortBy);
        return ResponseEntity.ok(result.getContent());
    }

    /* ── GET /api/employees/stats ────────────────────────────── */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(employeeService.getStats());
    }

    /* ── GET /api/employees/recent ───────────────────────────── */
    @GetMapping("/recent")
    public ResponseEntity<List<EmployeeDTO>> getRecent() {
        return ResponseEntity.ok(employeeService.getRecent());
    }

    /* ── GET /api/employees/search ───────────────────────────── */
    @GetMapping("/search")
    public ResponseEntity<List<EmployeeDTO>> search(@RequestParam String q) {
        Page<EmployeeDTO> result = employeeService.search(q, null, null, 0, 20, "firstName");
        return ResponseEntity.ok(result.getContent());
    }

    /* ── GET /api/employees/{id} ─────────────────────────────── */
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getById(id));
    }

    /* ── POST /api/employees ─────────────────────────────────── */
    @PostMapping
    public ResponseEntity<EmployeeDTO> create(@Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(dto));
    }

    /* ── PUT /api/employees/{id} ─────────────────────────────── */
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> update(@PathVariable Long id,
                                              @Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(employeeService.update(id, dto));
    }

    /* ── DELETE /api/employees/{id} ──────────────────────────── */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
