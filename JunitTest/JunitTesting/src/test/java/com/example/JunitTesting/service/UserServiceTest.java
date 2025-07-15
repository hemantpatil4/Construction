package com.example.JunitTesting.service;

import com.example.JunitTesting.models.User;
import com.example.JunitTesting.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;


import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    @Mock
    public UserRepository userRepository;

    @InjectMocks
    public UserService userService;


    @Test
    public void testGetUserbyId(){
    User user=new User(1L,"test1","test@gmail.com");
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    Optional<User> user1=userService.getUserById(1L);
    assertEquals("test1", user1.get().name);

    verify(userRepository, times(1)).findById(1L);
    }

    @Test
    public void testSaveUser_validuser(){
        User user=new User(1L,"test1","test@gmail.com");
        when(userRepository.save(user)).thenReturn(user);
        User result=userService.saveUser(user);
        assertEquals(result,user);
    }
    @Test
    public void testSaveUser_nulluser(){
        User user=null;
        assertThrows(IllegalArgumentException.class, () -> {
            userService.saveUser(user);
        });
    }

    @Test
    public void testSaveUser_duplicateEmail(){
        User existingUser=new User(1L,"test1","test@gmail.com");
        when(userRepository.save(existingUser)).thenThrow(DataIntegrityViolationException.class);
        assertThrows(DataIntegrityViolationException.class,()->{
            userService.saveUser(existingUser);
        });
    }



}
