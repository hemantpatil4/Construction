package com.example.JunitTesting.service;


import com.example.JunitTesting.models.User;
import com.example.JunitTesting.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // 🔹 Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 🔹 Get user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // 🔹 Save (create or update) a user
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // 🔹 Delete user by ID
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
