package ru.ak.lawcrmsystem3.app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.view.main.MainView;

@Component
public class SchedulerService {

//    @Autowired
//    private JdbcTemplate jdbcTemplate;
//
//    private MainView mainView;
//
//    public void setMainView(MainView mainView) {
//        this.mainView = mainView;
//    }
//
//    @Scheduled(fixedRate = 30000)
//    public void checkIncompleteTasks() {
//        if (mainView != null) {
//            // 👈 Исправленный SQL-запрос с правильными именами таблицы и колонки
//            Long count = jdbcTemplate.queryForObject(
//                    "SELECT COUNT(*) FROM TASK_ WHERE TASK_STATUS <> 'Complete'", Long.class
//            );
//
//            mainView.updateTasksButton(count);
//        }
//    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Этот метод теперь просто возвращает данные
    public long getIncompleteTasksCount() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM TASK_ WHERE TASK_STATUS <> 'Complete'", Long.class
        );
    }

}