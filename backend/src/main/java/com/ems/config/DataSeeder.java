package com.ems.config;

import com.ems.entity.User;
import com.ems.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUser("admin@ems.com",   "Admin@123",  "Admin User",      User.Role.ADMIN);
        seedUser("hr@ems.com",      "Hr@123",     "HR Manager",      User.Role.HR_MANAGER);
        seedUser("manager@ems.com", "Manager@123","Department Manager", User.Role.MANAGER);
        seedUser("emp@ems.com",     "Emp@123",    "John Employee",   User.Role.EMPLOYEE);
    }

    private void seedUser(String email, String rawPassword, String name, User.Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .name(name)
                    .role(role)
                    .enabled(true)
                    .build();
            userRepository.save(user);
            log.info("Seeded user: {} ({})", email, role);
        } else {
            log.info("User already exists: {}", email);
        }
    }
}
