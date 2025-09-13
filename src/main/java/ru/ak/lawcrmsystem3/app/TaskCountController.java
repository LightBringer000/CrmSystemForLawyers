package ru.ak.lawcrmsystem3.app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/rest/entities/Task_")
public class TaskCountController {

    @Autowired
    private SchedulerService schedulerService;

    @GetMapping("/incomplete-count")
    public ResponseEntity<Map<String, Long>> getIncompleteTasksCount() {
        try {
            long count = schedulerService.getIncompleteTasksCount();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("count", 0L));
        }
    }
}
