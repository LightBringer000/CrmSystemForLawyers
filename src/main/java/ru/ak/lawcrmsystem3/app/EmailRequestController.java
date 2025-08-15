package ru.ak.lawcrmsystem3.app;

import io.jmix.core.DataManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.ak.lawcrmsystem3.entity.EmailAttachment;
import ru.ak.lawcrmsystem3.entity.EmailRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/rest/entities/EmailRequest")
public class EmailRequestController {


    private final Logger log = LoggerFactory.getLogger(EmailRequestController.class);

    @Autowired
    private DataManager dataManager; // Jmix DataManager для работы с базой данных

    @Autowired
    private EmailRequestService emailRequestService; // Ваш сервис для отправки email

    /**
     * Обрабатывает POST-запросы для отправки EmailRequest.
     * Сохраняет EmailRequest и его вложения в БД, затем отправляет письмо.
     *
     * @param emailRequest Объект EmailRequest, пришедший в теле запроса JSON.
     * @return Карта с статусом и сообщением о результате операции.
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendEmail(@RequestBody EmailRequest emailRequest) {
        log.info("Received request to send email to: {}", emailRequest.getClientEmail());
        try {
            // 1. Создаем новую сущность EmailRequest с помощью DataManager
            // Это гарантирует, что Jmix правильно инициализирует все внутренние метаданные,
            // включая генерацию ID.
            EmailRequest newEmailRequest = dataManager.create(EmailRequest.class);

            // 2. Копируем данные из объекта, полученного от клиента, в новую Jmix-сущность
            newEmailRequest.setClientEmail(emailRequest.getClientEmail());
            newEmailRequest.setSubject(emailRequest.getSubject());
            newEmailRequest.setBody(emailRequest.getBody());

            // 3. Обрабатываем вложения: создаем новые Jmix-сущности EmailAttachment
            // и связываем их с newEmailRequest
            if (emailRequest.getAttachments() != null && !emailRequest.getAttachments().isEmpty()) {
                List<EmailAttachment> attachments = new ArrayList<>();
                for (EmailAttachment clientAttachment : emailRequest.getAttachments()) {
                    EmailAttachment newAttachment = dataManager.create(EmailAttachment.class);
                    newAttachment.setFileName(clientAttachment.getFileName());
                    newAttachment.setMimeType(clientAttachment.getMimeType());
                    newAttachment.setFileSize(clientAttachment.getFileSize());
                    newAttachment.setContent(clientAttachment.getContent()); // content уже декодирован Spring'ом
                    newAttachment.setEmailRequest(newEmailRequest); // Устанавливаем обратную ссылку
                    attachments.add(newAttachment);
                }
                newEmailRequest.setAttachments(attachments);
            }

            // 4. Сохраняем новую сущность EmailRequest со всеми вложениями
            EmailRequest savedEmailRequest = dataManager.save(newEmailRequest);
            log.info("EmailRequest entity with ID {} saved successfully.", savedEmailRequest.getId());

            // 5. Используем наш сервис для фактической отправки письма
            emailRequestService.sendEmail(savedEmailRequest);

            return new ResponseEntity<>(Map.of("status", "success", "message", "Письмо успешно отправлено и сохранено."), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to send or save email request", e);
            return new ResponseEntity<>(Map.of("status", "error", "message", "Ошибка при отправке или сохранении письма: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
