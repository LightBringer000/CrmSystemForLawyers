package ru.ak.lawcrmsystem3.app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import io.jmix.core.DataManager;
import io.jmix.core.event.EntityChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.annotation.Transactional;
import ru.ak.lawcrmsystem3.entity.EmailEntityBrowse;

@Component
public class EmailEntityBrowseChangeListener {

    private static final Logger log = LoggerFactory.getLogger(EmailEntityBrowseChangeListener.class);

    private final DataManager dataManager;
    @Autowired
    private  EmailSenderService emailService;

    public EmailEntityBrowseChangeListener(DataManager dataManager) {
        this.dataManager = dataManager;
    }

    @EventListener // Аннотация для обработки событий Spring
    @Transactional // Опционально, если вам нужен активный транзакционный контекст для логики внутри слушателя
    public void onEmailEntityBrowseChanged(EntityChangedEvent<EmailEntityBrowse> event) {
        // Проверяем тип изменения: CREATED (создание), UPDATED (обновление), DELETED (удаление)
        if (event.getType() == EntityChangedEvent.Type.CREATED) {
            log.info("Новый экземпляр EmailEntityBrowse создан: {}", event.getEntityId());

            // Загружаем полную сущность, если нужны ее поля
            EmailEntityBrowse newEmailEntity = dataManager.load(EmailEntityBrowse.class)
                    .id(event.getEntityId())
                    .one();

            log.info("Созданное письмо с темой: {}", newEmailEntity.getContent());

            // Здесь можно добавить свою логику:
            // - Отправить уведомление
            // - Обновить другие сущности
            // - Выполнить какие-либо бизнес-правила
            // updateSomeOtherEntities(newEmailEntity);
            log.info("Отправляем письмо с темой: {}", newEmailEntity.getContent());

            emailService.sendEmailNotification(newEmailEntity);

            log.info("Отправлено письмо с темой: {}", newEmailEntity.getContent());

        }
    }

}