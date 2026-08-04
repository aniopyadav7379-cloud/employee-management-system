package com.ems.service;

import com.ems.config.JwtUtil;
import com.ems.dto.LoginRequest;
import com.ems.dto.LoginResponse;
import com.ems.entity.User;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final DataSource dataSource;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuthenticationManager authenticationManager,
            DataSource dataSource) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.dataSource = dataSource;
    }

    public LoginResponse login(LoginRequest request) {

    try (Connection con = dataSource.getConnection()) {

        System.out.println("====================================");
        System.out.println("Connected URL : " + con.getMetaData().getURL());
        System.out.println("Database      : " + con.getCatalog());
        System.out.println("DB User       : " + con.getMetaData().getUserName());
        System.out.println("====================================");

    } catch (Exception e) {
        e.printStackTrace();
    }

    System.out.println("====================================");
    System.out.println("Email    : " + request.getEmail());
    System.out.println("Password : " + request.getPassword());
    System.out.println("====================================");

    System.out.println("USERS FOUND IN DATABASE:");

    userRepository.findAll().forEach(u ->
            System.out.println(
                    u.getId() + " | " +
                    u.getEmail() + " | " +
                    u.getRole()
            )
    );

    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

    System.out.println("====================================");
    System.out.println("Stored Hash : " + user.getPassword());

    boolean match = passwordEncoder.matches(
            request.getPassword(),
            user.getPassword()
    );

    System.out.println("Password Match : " + match);
    System.out.println("====================================");

    Authentication authentication =
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

    String token = jwtUtil.generateToken(authentication);

    return LoginResponse.builder()
            .token(token)
            .userId(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
}

    @Transactional(readOnly = true)
    public User getCurrentUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User",
                                "email",
                                email
                        ));
    }

    public void changePassword(
            String email,
            String currentPassword,
            String newPassword) {

        User user = getCurrentUser(email);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}