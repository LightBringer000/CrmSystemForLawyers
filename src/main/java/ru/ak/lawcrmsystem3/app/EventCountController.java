package ru.ak.lawcrmsystem3.app;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
//@RequestMapping("/api/events")
@RequestMapping("/rest/entities/Event")
@CrossOrigin(origins = "*")
public class EventCountController {

    @Autowired
    private SchedulerService schedulerService;

    @GetMapping("/upcoming-count")
    public ResponseEntity<Map<String, Long>> getUpcomingEventsCount() {
        try {
            long count = schedulerService.getUpcomingEventsCount();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("count", 0L));
        }
    }
}
