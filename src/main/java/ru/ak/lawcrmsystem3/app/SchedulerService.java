package ru.ak.lawcrmsystem3.app;

import io.jmix.core.security.CurrentAuthentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.CrossOrigin;
import ru.ak.lawcrmsystem3.entity.ReceivedEmail;
import ru.ak.lawcrmsystem3.entity.User;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Component
@CrossOrigin(origins = "*")
public class SchedulerService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CurrentAuthentication currentAuthentication;

    @Autowired
    private EmailReceiverService emailReceiverService;

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

    //Получение информации обо всех событиях, дата окончания которых не наступила либо, дата окончания которых null
    public long getUpcomingEventsCount() {
        Collection<? extends GrantedAuthority> authorities = currentAuthentication.getAuthentication().getAuthorities();

        boolean hasFullAccess = authorities.stream()
                .anyMatch(grantedAuthority -> "ROLE_system-full-access".equals(grantedAuthority.getAuthority()));

        LocalDateTime now = LocalDateTime.now();

        if (hasFullAccess) {
            // Пользователь с полным доступом: все будущие события
            Long result = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM EVENT WHERE END_DATE IS NULL OR END_DATE > ?",
                    Long.class,
                    now
            );
            return result != null ? result : 0L;
        } else {
            // Другие пользователи: только их будущие события
            User currentUser = (User) currentAuthentication.getUser();
            UUID currentUserId = currentUser.getId();

            Long result = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM EVENT e " +
                            "JOIN EVENT_USER_LINK eul ON e.ID = eul.EVENT_ID " +
                            "WHERE (e.END_DATE IS NULL OR e.END_DATE > ?) AND eul.USER_ID = ?",
                    Long.class,
                    now,
                    currentUserId
            );
            return result != null ? result : 0L;
        }
    }

//    public long getUnreadEmailsCount() {
//        try {
//            if (!currentAuthentication.isSet()) {
//                return 0L;
//            }
//
//            User currentUser = (User) currentAuthentication.getUser();
//            if (currentUser == null) {
//                return 0L;
//            }
//
//            // Используем уже существующий сервис для получения писем
//            List<ReceivedEmail> emails = emailReceiverService.receiveNewEmails();
//
//            // Фильтруем письма за последние 7 дней
//            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
//            long recentEmailsCount = emails.stream()
//                    .filter(email -> email.getReceivedDate() != null)
//                    .filter(email -> email.getReceivedDate().toInstant()
//                            .atZone(ZoneId.systemDefault())
//                            .toLocalDateTime()
//                            .isAfter(sevenDaysAgo))
//                    .count();
//
//            return recentEmailsCount;
//
//        } catch (Exception e) {
//            System.err.println("Ошибка при получении количества писем: " + e.getMessage());
//            return 0L;
//        }
//    }

    public long getUnreadEmailsCount() {
        try {
            if (!currentAuthentication.isSet()) {
                return 0L;
            }

            User currentUser = (User) currentAuthentication.getUser();
            if (currentUser == null) {
                return 0L;
            }

            // Используем новый метод для получения только непрочитанных писем
            List<ReceivedEmail> emails = emailReceiverService.receiveUnreadEmails();

            // Теперь просто возвращаем размер списка, так как все письма уже отфильтрованы
            return emails.size();

        } catch (Exception e) {
            System.err.println("Ошибка при получении количества писем: " + e.getMessage());
            return 0L;
        }
    }

}