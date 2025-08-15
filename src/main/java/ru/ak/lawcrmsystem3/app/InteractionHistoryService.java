package ru.ak.lawcrmsystem3.app;

import io.jmix.core.DataManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.*;
import java.time.OffsetDateTime;
import java.util.Objects;

@Component
public class InteractionHistoryService {

    private static final Logger log = LoggerFactory.getLogger(InteractionHistoryService.class);

    @Autowired
    private DataManager dataManager;

    public void recordInteraction(ClientRelatedEntity entity, String interactionType) {
        try {
            Objects.requireNonNull(entity, "Entity cannot be null");

            InteractionsHistory history = dataManager.create(InteractionsHistory.class);
            history.setClient(entity.getClient());
            history.setInteractionType(interactionType);
            history.setDetails(entity.getInteractionDescription());
            history.setCreatedDate(OffsetDateTime.now());

            linkToSpecificEntity(history, entity);

            dataManager.save(history);
        } catch (Exception e) {
            log.error("Failed to record interaction for {}", entity, e);
        }
    }

    private void linkToSpecificEntity(InteractionsHistory history, ClientRelatedEntity entity) {
        if (entity instanceof Event event) {
            history.setRelatedEvent(event);
        } else if (entity instanceof EmailRequest email) {
            history.setRelatedEmail(email);
        } else if (entity instanceof Task task) {
            history.setRelatedTask(task);
        }
    }

}