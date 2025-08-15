package ru.ak.lawcrmsystem3.app;

import io.jmix.core.DataManager;
import io.jmix.core.event.EntityChangedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.EmailRequest;
import ru.ak.lawcrmsystem3.entity.Event;
import ru.ak.lawcrmsystem3.entity.Task;

@Component
public class InteractionHistoryEventListener {

    @Autowired
    private InteractionHistoryService historyService;
    @Autowired
    private DataManager dataManager;

    @EventListener
    public void onEventCreated(EntityChangedEvent<Event> event) {
        if (event.getType() == EntityChangedEvent.Type.CREATED) {
            Event entity = dataManager.load(Event.class).id(event.getEntityId()).one();
            historyService.recordInteraction(entity, "MEETING");
        }
    }

    @EventListener
    public void onEmailRequestCreated(EntityChangedEvent<EmailRequest> event) {
        if (event.getType() == EntityChangedEvent.Type.CREATED) {
            EmailRequest entity = dataManager.load(EmailRequest.class).id(event.getEntityId()).one();
            historyService.recordInteraction(entity, "EMAIL");
        }
    }

    @EventListener
    public void onTaskCreated(EntityChangedEvent<Task> event) {
        if (event.getType() == EntityChangedEvent.Type.CREATED) {
            Task entity = dataManager.load(Task.class).id(event.getEntityId()).one();
            historyService.recordInteraction(entity, "TASK");
        }
    }

}