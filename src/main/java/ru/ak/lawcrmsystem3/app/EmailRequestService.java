package ru.ak.lawcrmsystem3.app;

import io.jmix.core.DataManager;
import io.jmix.email.EmailInfoBuilder;
import io.jmix.email.Emailer;
import io.jmix.email.EmailAttachment; // Это класс Jmix Email

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.EmailRequest;

import java.util.Objects;


@Component
public class EmailRequestService  {

    private final Logger log = LoggerFactory.getLogger(EmailRequestService.class);
    @Autowired
    protected DataManager dataManager;

    @Autowired
    private Emailer emailer; // Сервис для отправки email от Jmix

//    /**
//     * Обрабатывает и отправляет EmailRequest, включая вложения.
//     *
//     * @param emailRequest Объект EmailRequest, содержащий информацию о письме и вложениях.
//     */
public void sendEmail(EmailRequest emailRequest) {
    log.info("Attempting to send email for EmailRequest ID: {}", emailRequest.getId());
    try {
        EmailInfoBuilder builder = EmailInfoBuilder.create()
                .setAddresses(emailRequest.getClientEmail())
                .setSubject(emailRequest.getSubject())
                .setFrom("shield_and_sword_company@mail.ru") // Укажите ваш адрес отправителя
                .setBody(emailRequest.getBody());

        if (emailRequest.getAttachments() != null && !emailRequest.getAttachments().isEmpty()) {
            log.debug("Found {} attachments for EmailRequest ID: {}", emailRequest.getAttachments().size(), emailRequest.getId());

            // Перебираем сущности EmailAttachment, используя полное квалифицированное имя
            for (ru.ak.lawcrmsystem3.entity.EmailAttachment entityAttachment : emailRequest.getAttachments()) {
                if (entityAttachment.getContent() != null && entityAttachment.getContent().length > 0) {
                    // Создаем объект io.jmix.email.EmailAttachment из данных ВАШЕЙ сущности
                    EmailAttachment emailerAttachment = new EmailAttachment(
                            entityAttachment.getContent(),
                            Objects.requireNonNull(entityAttachment.getFileName()),
                            Objects.requireNonNull(entityAttachment.getMimeType())
                    );

                    // Добавляем вложение в EmailInfoBuilder
                    builder.addAttachment(emailerAttachment);
                    log.trace("Added attachment: '{}'", entityAttachment.getFileName());
                } else {
                    log.warn("Attachment '{}' for EmailRequest ID {} has no content and will be skipped.",
                            entityAttachment.getFileName(), emailRequest.getId());
                }
            }
        } else {
            log.debug("No attachments found for EmailRequest ID: {}", emailRequest.getId());
        }

        emailer.sendEmailAsync(builder.build());
        log.info("Email for EmailRequest ID {} sent successfully.", emailRequest.getId());
    } catch (Exception e) {
        log.error("Failed to send email for EmailRequest ID: {}", emailRequest.getId(), e);
        throw new RuntimeException("Ошибка при отправке письма для EmailRequest ID: " + emailRequest.getId(), e);
    }
}
}

