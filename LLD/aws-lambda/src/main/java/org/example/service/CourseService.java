package org.example.service;

import org.example.model.Course;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CourseService {
    private final List<Course> courses = new ArrayList<>();
    private Long nextId = 1L;

    public List<Course> getAllCourses() {
        return courses;
    }

    public Optional<Course> getCourseById(Long id) {
        return courses.stream().filter(c -> c.getId().equals(id)).findFirst();
    }

    public Course addCourse(Course course) {
        course.setId(nextId++);
        courses.add(course);
        return course;
    }

    public Optional<Course> updateCourse(Long id, Course updatedCourse) {
        Optional<Course> courseOpt = getCourseById(id);
        courseOpt.ifPresent(course -> {
            course.setName(updatedCourse.getName());
            course.setDescription(updatedCourse.getDescription());
        });
        return courseOpt;
    }

    public boolean deleteCourse(Long id) {
        return courses.removeIf(c -> c.getId().equals(id));
    }
}

