package ru.ak.lawcrmsystem3.app;

import io.jmix.core.security.CurrentAuthentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.User;

import java.util.Collection;
import java.util.UUID;

@Component
public class SchedulerService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CurrentAuthentication currentAuthentication;

    public long getIncompleteTasksCount() {
        Collection<? extends GrantedAuthority> authorities = currentAuthentication.getAuthentication().getAuthorities();

        authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .forEach(System.out::println);

        boolean hasFullAccess = authorities.stream()
                .anyMatch(grantedAuthority -> "ROLE_system-full-access".equals(grantedAuthority.getAuthority()));

        if (hasFullAccess) {
            // Пользователь с полным доступом: подсчитываем все незавершённые задачи
            Long result = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM TASK_ WHERE TASK_STATUS <> 'Complete'", Long.class
            );
            return result != null ? result : 0L;
        } else {
            // Другие пользователи: подсчитываем только их задачи, используя промежуточную таблицу
            User currentUser = (User) currentAuthentication.getUser();
            UUID currentUserId = currentUser.getId(); // Здесь нет .toString()

            Long result = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM TASK_ t " +
                            "JOIN TASK_USER_LINK tul ON t.ID = tul.TASK_ID " +
                            "WHERE t.TASK_STATUS <> 'Complete' AND tul.USER_ID = ?",
                    Long.class,
                    currentUserId // Передаём объект UUID напрямую
            );
            return result != null ? result : 0L;
        }
    }
}