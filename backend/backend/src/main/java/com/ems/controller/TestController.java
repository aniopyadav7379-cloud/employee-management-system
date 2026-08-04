package com.ems.controller;

import com.ems.repository.UserRepository;
import com.ems.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public TestController(PasswordEncoder passwordEncoder,
                          UserRepository userRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    @GetMapping("/test/password")
    public String password() {

        User user = userRepository.findByEmail("admin@ems.com").orElse(null);

        if (user == null) {
            return "User not found";
        }

        boolean match = passwordEncoder.matches("Admin@123", user.getPassword());

        return "Password Match = " + match +
                "<br><br>Stored Hash = " + user.getPassword();
    }

    @GetMapping("/test/hash")
    public String hash() {
        return passwordEncoder.encode("Admin@123");
    }
}