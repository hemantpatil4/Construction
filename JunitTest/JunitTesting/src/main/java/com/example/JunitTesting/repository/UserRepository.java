package com.example.JunitTesting.repository;

import com.example.JunitTesting.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {}
