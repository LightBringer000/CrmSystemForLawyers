package ru.ak.lawcrmsystem3.view.casestage;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.router.*;
import io.jmix.core.DataManager;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.ViewNavigators;
import io.jmix.flowui.component.layout.ViewLayout;
import io.jmix.flowui.kit.component.button.JmixButton;
import io.jmix.flowui.model.CollectionContainer;
import io.jmix.flowui.model.CollectionLoader;
import io.jmix.flowui.model.InstanceContainer;
import io.jmix.flowui.view.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.ak.lawcrmsystem3.dto.StageDto;
import ru.ak.lawcrmsystem3.dto.StageOrderUpdate;
import ru.ak.lawcrmsystem3.entity.CaseStage;
import ru.ak.lawcrmsystem3.entity.Deal;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

//@Route(value = "case-stage-view", layout = MainView.class)
@Route(value = "case-stage-view/:dealId?", layout = MainView.class)
@ViewController(id = "CaseStageView")
@ViewDescriptor(path = "case-stage-view.xml")
public class CaseStageView extends StandardView implements AfterNavigationObserver {


    private static final Logger log = LoggerFactory.getLogger(CaseStageView.class);

    @Autowired
    private DataManager dataManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    @NonNull
    protected ViewLayout initContent() {
        ViewLayout content = super.initContent();

        String htmlContent = loadHtmlContent("/static/caseStageView.html");
        Html html = new Html(htmlContent);
        content.add(html);

        Page page = UI.getCurrent().getPage();
        page.addJavaScript("/js/caseStageView.js");

        page.executeJs("""
            document.addEventListener('DOMContentLoaded', function() {
                const modal = document.getElementById('stage-modal');
                if (modal) modal.style.display = 'none';
            });
        """);

        String username = getCurrentUsername();
        UI.getCurrent().getPage().executeJs(
                "window.userSession = { username: $0 };",
                username
        );
        log.info("Initialized user session for case stage view: username={}", username);

        return content;
    }

    private String loadHtmlContent(String resourcePath) {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IOException("HTML file not found: " + resourcePath);
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to load HTML file: {}", resourcePath, e);
            throw new RuntimeException("Failed to load HTML file: " + resourcePath, e);
        }
    }

    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new RuntimeException("User not authenticated");
    }

    @ClientCallable
    public String getAvailableProcessTypes() {
        try {
            // Получаем уникальные типы процессов
            List<String> processTypes = dataManager.loadValue(
                            "select distinct s.processType from CaseStage s where s.processType is not null order by s.processType",
                            String.class)
                    .list();

            // Возвращаем пустой массив, если нет процессов
            return objectMapper.writeValueAsString(processTypes);
        } catch (Exception e) {
            log.error("Error getting process types", e);
            return "[]"; // Пустой массив вместо дефолтного значения
        }
    }

    @ClientCallable
    public void addProcessType(String processType) {
        if (processType == null || processType.trim().isEmpty()) {
            throw new IllegalArgumentException("Название процесса не может быть пустым");
        }

        // Проверяем, что такого процесса еще нет
        long count = dataManager.loadValue(
                        "select count(s) from CaseStage s where s.processType = :processType",
                        Long.class)
                .parameter("processType", processType)
                .one();

        if (count > 0) {
            throw new IllegalArgumentException("Процесс с таким названием уже существует");
        }
    }

    @ClientCallable
    public String getStages(String processType) {
        try {
            List<CaseStage> stages = dataManager.load(CaseStage.class)
                    .query("select s from CaseStage s where s.processType = :processType order by s.orderIndex")
                    .parameter("processType", processType)
                    .list();

            // Явно маппим поля, чтобы избежать null значений
            List<Map<String, Object>> result = stages.stream()
                    .map(stage -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", stage.getId().toString());
                        map.put("stageName", stage.getStageName());
                        map.put("stageDescription", stage.getStageDescription());
                        map.put("status", stage.getStatus() != null ? stage.getStatus() : "PLANNED");
                        map.put("processName", stage.getProcessType());
                        map.put("startDate", stage.getStartDate() != null ?
                                stage.getStartDate().format(DateTimeFormatter.ISO_DATE) : null);
                        map.put("endDate", stage.getEndDate() != null ?
                                stage.getEndDate().format(DateTimeFormatter.ISO_DATE) : null);
                        return map;
                    })
                    .collect(Collectors.toList());

            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            log.error("Error loading stages", e);
            throw new RuntimeException("Error loading stages", e);
        }
    }

    private Map<String, Object> convertToMap(CaseStage stage) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", stage.getId() != null ? stage.getId().toString() : null);
        map.put("stageName", stage.getStageName());
        map.put("stageDescription", stage.getStageDescription());
        map.put("status", stage.getStatus());
        map.put("orderIndex", stage.getOrderIndex());

        // Изменения здесь - используем ISO_LOCAL_DATE вместо ISO_LOCAL_DATE_TIME
        map.put("startDate", stage.getStartDate() != null ?
                stage.getStartDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : null);
        map.put("endDate", stage.getEndDate() != null ?
                stage.getEndDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : null);

        return map;
    }

    @ClientCallable
    public void updateStageOrder(String updatesJson) {
        try {
            log.info("Received stage order updates: {}", updatesJson);

            // Десериализуем JSON в массив
            StageOrderUpdate[] updates = objectMapper.readValue(updatesJson, StageOrderUpdate[].class);

            for (StageOrderUpdate update : updates) {
                CaseStage stage = dataManager.load(CaseStage.class).id(update.id()).one();
                stage.setOrderIndex(update.orderIndex());
                dataManager.save(stage);
            }
        } catch (Exception e) {
            log.error("Error updating stage order", e);
            throw new RuntimeException("Error updating stage order", e);
        }
    }


    @ClientCallable
    public String saveStage(String stageJson) {
        try {
            // Настройка маппера для корректной десериализации дат
            // (если objectMapper не настроен глобально или через @PostConstruct)
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            // Десериализация JSON в DTO
            StageDto dto = objectMapper.readValue(stageJson, StageDto.class);
            log.info("Attempting to save stage: DTO={}", dto);

            // Валидация обязательных полей
            if (dto.stageName() == null || dto.stageName().trim().isEmpty()) {
                throw new IllegalArgumentException("Название стадии обязательно");
            }

            CaseStage stage;
            // Проверяем, передан ли ID для обновления или это новая стадия
            if (dto.id() != null && !dto.id().isEmpty()) {
                // ============================== Обновление существующей стадии ==============================
                log.info("Attempting to update existing stage with ID: {}", dto.id());
                UUID stageUuid;
                try {
                    stageUuid = UUID.fromString(dto.id());
                } catch (IllegalArgumentException e) {
                    log.error("Invalid UUID format for stage ID: {}", dto.id(), e);
                    throw new IllegalArgumentException("Неверный формат ID стадии", e);
                }

                stage = dataManager.load(CaseStage.class)
                        .id(stageUuid)
                        .optional() // Используем optional для более безопасной загрузки
                        .orElse(null);

                if (stage == null) {
                    log.warn("Stage with ID {} not found for update, creating a new one instead.", dto.id());
                    // Если стадия не найдена по переданному ID, создаем новую
                    // Это поведение можно изменить на просто выбрасывание ошибки, если вы не хотите неявного создания
                    stage = dataManager.create(CaseStage.class);
                    // Важно: Если мы создаем новую, ей нужен новый UUID
                    if (stage.getId() == null) {
                        stage.setId(UUID.randomUUID());
                    }
                    // Устанавливаем processType и orderIndex для новой стадии
                    stage.setProcessType(dto.processType() != null ? dto.processType() : "Основной процесс");
                    Integer maxOrder = dataManager.loadValue(
                                    "select max(s.orderIndex) from CaseStage s where s.processType = :processType",
                                    Integer.class)
                            .parameter("processType", stage.getProcessType())
                            .one();
                    stage.setOrderIndex(maxOrder != null ? maxOrder + 1 : 0);

                } else {
                    log.debug("Found existing stage for update: {}", stage.getId());
                }
            } else {
                // ============================== Создание новой стадии ==============================
                log.info("Attempting to create a new stage.");
                stage = dataManager.create(CaseStage.class);
                // Генерируем новый уникальный UUID для новой стадии
                // Это критично для того, чтобы стадии не перезаписывали друг друга
                if (stage.getId() == null) { // Проверяем, не был ли он уже сгенерирован автоматически (например, Jmix entity base)
                    stage.setId(UUID.randomUUID());
                    log.debug("Assigned new UUID to stage: {}", stage.getId());
                } else {
                    log.debug("Stage already has an ID assigned by DataManager: {}", stage.getId());
                }


                stage.setProcessType(dto.processType() != null ?
                        dto.processType() : "Основной процесс");

                // Установка порядка для новой стадии (последний + 1)
                Integer maxOrder = dataManager.loadValue(
                                "select max(s.orderIndex) from CaseStage s where s.processType = :processType",
                                Integer.class)
                        .parameter("processType", stage.getProcessType())
                        .one();
                stage.setOrderIndex(maxOrder != null ? maxOrder + 1 : 0);
            }

            // ============================== Обновление общих полей ==============================
            // Эти поля обновляются как для новых, так и для существующих стадий
            stage.setStageName(dto.stageName());
            stage.setStageDescription(dto.stageDescription());
            stage.setStatus(dto.status() != null ? dto.status() : "PLANNED");

            // Обработка дат
            stage.setStartDate(dto.startDate());
            stage.setEndDate(dto.endDate());

            // Сохранение стадии
            CaseStage savedStage = dataManager.save(stage);
            log.info("Stage saved successfully with final ID: {}", savedStage.getId());

            // Возвращаем ID сохраненной стадии. Это может быть полезно для фронтенда,
            // если вы хотите сразу обновить ID в скрытом поле модального окна для последующего редактирования
            return savedStage.getId().toString();
        } catch (Exception e) {
            log.error("Error saving stage: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка сохранения стадии: " + e.getMessage(), e);
        }
    }

    @ClientCallable
    public void deleteStage(String stageId) {
        try {
            log.info("Attempting to delete stage with ID: {}", stageId);

            // Проверка на null и пустую строку
            if (stageId == null || stageId.isEmpty()) {
                throw new IllegalArgumentException("Stage ID cannot be null or empty");
            }

            UUID uuid;
            try {
                uuid = UUID.fromString(stageId);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid stage ID format: " + stageId, e);
            }

            // Проверка существования перед удалением
            if (!dataManager.load(CaseStage.class).id(uuid).optional().isPresent()) {
                log.warn("Stage with ID {} not found, cannot delete", stageId);
                throw new RuntimeException("Stage not found or already deleted");
            }

            CaseStage stage = dataManager.load(CaseStage.class).id(uuid).one();
            dataManager.remove(stage);
            log.info("Successfully deleted stage with ID: {}", stageId);

        } catch (Exception e) {
            log.error("Error deleting stage with ID: " + stageId, e);
            throw new RuntimeException("Error deleting stage: " + e.getMessage(), e);
        }
    }
}