package com.cinechain.service;

import com.cinechain.dto.user.UserDto;
import com.cinechain.entity.User;
import com.cinechain.enums.Role;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Page<UserDto> getCustomers(Pageable pageable) {
        return userRepository.findByRole(Role.CUSTOMER, pageable).map(UserDto::from);
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.from(user);
    }

    @Transactional
    public UserDto toggleUserStatus(Long id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setEnabled(enabled);
        return UserDto.from(userRepository.save(user));
    }
}
