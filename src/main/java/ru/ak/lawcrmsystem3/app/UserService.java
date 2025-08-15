package ru.ak.lawcrmsystem3.app;

import com.vaadin.flow.component.notification.Notification;
import io.jmix.core.DataManager;
import io.jmix.core.security.CurrentAuthentication;
import io.jmix.flowui.Notifications;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.User;
import ru.ak.lawcrmsystem3.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Component
public class UserService{

    private final Logger log = LoggerFactory.getLogger(UserService.class);


    private final DataManager dataManager;
    private final Notifications notifications;
    private final UserRepository userRepository;

    @Autowired
    private CurrentAuthentication currentAuthentication;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(DataManager dataManager, Notifications notifications,
                       UserRepository userRepository) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        this.userRepository = userRepository;
    }

    public User saveUser(User entity) {
        User currentUser = currentAuthentication.isSet() ?
                (User) currentAuthentication.getUser() : null;

        // Проверка на нового пользователя (регистрация)
        boolean isNewUser = entity.getId() == null;

        // Для существующих пользователей проверяем владельца
        if (!isNewUser && (currentUser == null || !currentUser.getId().equals(entity.getId()))) {
            notifications.create("Вы можете изменять только свой профиль и не можете изменять профили других пользователей!")
                    .withType(Notifications.Type.ERROR)
                    .show();
            return null;
        }

        User existingUser = dataManager.load(User.class)
                .query("SELECT u FROM User u WHERE u.username = :username")
                .parameter("username", entity.getUsername())
                .optional()
                .orElse(null);

        // Проверка уникальности username
        if (existingUser != null && !existingUser.getId().equals(entity.getId())) {
            notifications.create("Пользователь с таким никнеймом уже существует")
                    .withType(Notifications.Type.ERROR)
                    .show();
            return null;
        }

        // Сохранение пароля
        if (existingUser != null &&
                (entity.getPassword() == null || entity.getPassword().isEmpty())) {
            entity.setPassword(existingUser.getPassword());
        }

        return dataManager.save(entity);
    }

    public UUID findUserIdByUsername(String username) {
        List<UUID> result = dataManager.loadValue(
                "SELECT u.id FROM User u WHERE u.username = :username",
                UUID.class
        ).parameter("username", username).list();

        if (!result.isEmpty()) {
            return result.getFirst();
        } else {
            return null; // Или выбросить исключение, если пользователь не найден
        }
    }

    public String findFirstNameByUsername(String username) {
        List<String> result = dataManager.loadValue(
                "SELECT u.firstName FROM User u WHERE u.username = :username",
                String.class
        ).parameter("username", username).list();

        if (!result.isEmpty()) {
            return result.getFirst();
        } else {
            return null; // Или выбросить исключение, если пользователь не найден
        }
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    //=====
    public boolean isOwner(User entity) {
        if (currentAuthentication.isSet()) {
            User currentUser = (User) currentAuthentication.getUser();
            return currentUser.getId().equals(entity.getId());
        }
        return false;
    }


    public boolean updatePassword(UUID userId, String newPassword) {
        if (!currentAuthentication.isSet()) {
            return false;
        }

        User currentUser = (User) currentAuthentication.getUser();
        if (!currentUser.getId().equals(userId)) {
            return false;
        }

        try {
            User user = dataManager.load(User.class).id(userId).one();
            user.setPassword(passwordEncoder.encode(newPassword));
            dataManager.save(user);
            return true;
        } catch (Exception e) {
            log.error("Ошибка при обновлении пароля", e);
            return false;
        }
    }
    //=========
}