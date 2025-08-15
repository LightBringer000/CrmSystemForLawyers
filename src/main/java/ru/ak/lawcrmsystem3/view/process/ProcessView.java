package ru.ak.lawcrmsystem3.view.process;


import com.fasterxml.jackson.databind.JsonNode;
import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.StandardView;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import ru.ak.lawcrmsystem3.entity.CaseStage;
import ru.ak.lawcrmsystem3.entity.Deal;
import ru.ak.lawcrmsystem3.view.main.MainView;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.router.AfterNavigationEvent;
import io.jmix.core.DataManager;
import io.jmix.flowui.Notifications;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.ak.lawcrmsystem3.view.deal.DealListView;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import ru.ak.lawcrmsystem3.entity.Process;

import java.util.UUID;

@Route(value = "process-view/:dealId?", layout = MainView.class)
@ViewController(id = "ProcessView")
@ViewDescriptor(path = "process-view.xml")
public class ProcessView extends StandardView {

    private static final Logger log = LoggerFactory.getLogger(ProcessView.class);

    @Autowired
    private DataManager dataManager;

    @Autowired
    private Notifications notifications;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID dealId;

    @Override
    public void afterNavigation(AfterNavigationEvent event) {
        // Подробное логирование для отладки
        log.info("Navigation event location: {}", event.getLocation());
        log.info("Path: {}", event.getLocation().getPath());
        log.info("Query parameters: {}", event.getLocation().getQueryParameters());

        String path = event.getLocation().getPath();

        // Убираем возможные начальные/конечные слеши
        path = path.replaceAll("^/|/$", "");
        String[] segments = path.split("/");

        // Логируем сегменты пути
        log.info("Path segments: {}", Arrays.toString(segments));

        if (segments.length >= 2 && "process-view".equals(segments[segments.length - 2])) {
            String dealIdStr = segments[segments.length - 1];
            if (dealIdStr == null || dealIdStr.isEmpty()) {
                log.error("Empty deal ID");
                notifications.show("Не указан ID дела");
                return;
            }

            if (!isValidUUID(dealIdStr)) {
                log.error("Invalid UUID format: {}", dealIdStr);
                notifications.show("Некорректный формат ID дела");
                return;
            }
            try {
                this.dealId = UUID.fromString(dealIdStr);
                log.info("Successfully extracted dealId: {}", dealId);
                loadProcesses();
            } catch (IllegalArgumentException e) {
                log.error("Invalid deal ID format: {}", dealIdStr, e);
                notifications.show("Некорректный ID дела");
                // Возвращаем на предыдущую страницу при ошибке
                UI.getCurrent().navigate(DealListView.class);
            }
        } else {
            notifications.show("Не указан ID дела");
            UI.getCurrent().navigate(DealListView.class);
        }
    }


    private boolean isValidUUID(String uuidStr) {
        try {
            UUID.fromString(uuidStr);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private void loadProcesses() {
        try {
            String htmlContent = loadHtmlContent("/static/processView.html");
            Html html = new Html(htmlContent);
            getContent().add(html);

            Page page = UI.getCurrent().getPage();
            page.addJavaScript("/js/processView.js");

            // Передаем dealId в JavaScript
            page.executeJs("window.dealId = $0", dealId.toString());

            // Инициализация пользовательской сессии
            String username = getCurrentUsername();
            page.executeJs("window.userSession = { username: $0 };", username);

        } catch (Exception e) {
            log.error("Failed to initialize process view", e);
            notifications.show("Ошибка инициализации представления процессов");
        }
    }

    private String loadHtmlContent(String resourcePath) throws IOException {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IOException("HTML file not found: " + resourcePath);
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new RuntimeException("User not authenticated");
    }

    @ClientCallable
    public String getProcesses(String dealIdStr) {
        try {
            UUID dealId = UUID.fromString(dealIdStr);
            List<Process> processes = dataManager.load(Process.class)
                    .query("select p from Process p where p.deal.id = :dealId")
                    .parameter("dealId", dealId)
                    .list();

            return objectMapper.writeValueAsString(processes);
        } catch (Exception e) {
            log.error("Error loading processes", e);
            return "[]";
        }
    }

    @ClientCallable
    public String getStages(String processId) {
        try {
            UUID processUuid = UUID.fromString(processId);
            List<CaseStage> stages = dataManager.load(CaseStage.class)
                    .query("select s from CaseStage s where s.process.id = :processId order by s.orderIndex")
                    .parameter("processId", processUuid)
                    .list();

            List<Map<String, Object>> result = stages.stream().map(stage -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", stage.getId().toString());
                map.put("stageName", stage.getStageName());
                map.put("stageDescription", stage.getStageDescription());
                map.put("status", stage.getStatus() != null ? stage.getStatus() : "PLANNED");
                map.put("startDate", stage.getStartDate() != null ?
                        stage.getStartDate().format(DateTimeFormatter.ISO_DATE) : null);
                map.put("endDate", stage.getEndDate() != null ?
                        stage.getEndDate().format(DateTimeFormatter.ISO_DATE) : null);
                map.put("orderIndex", stage.getOrderIndex());
                return map;
            }).collect(Collectors.toList());

            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            log.error("Error loading stages", e);
            return "[]";
        }
    }

    @ClientCallable
    public void updateStageOrder(String updatesJson) {
        try {
            ProcessView.StageOrderUpdate[] updates = objectMapper.readValue(updatesJson, ProcessView.StageOrderUpdate[].class);
            for (ProcessView.StageOrderUpdate update : updates) {
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
            ProcessView.StageDto dto = objectMapper.readValue(stageJson, ProcessView.StageDto.class);

            if (dto.stageName() == null || dto.stageName().trim().isEmpty()) {
                throw new IllegalArgumentException("Название стадии обязательно");
            }

            CaseStage stage;
            if (dto.id() != null && !dto.id().isEmpty()) {
                stage = dataManager.load(CaseStage.class).id(UUID.fromString(dto.id())).optional().orElse(null);
                if (stage == null) {
                    stage = dataManager.create(CaseStage.class);
                }
            } else {
                stage = dataManager.create(CaseStage.class);
            }

            if (stage.getProcess() == null && dto.processId() != null) {
                ru.ak.lawcrmsystem3.entity.Process process = dataManager.load(ru.ak.lawcrmsystem3.entity.Process.class).id(UUID.fromString(dto.processId())).one();
                stage.setProcess(process);
            }

            stage.setStageName(dto.stageName());
            stage.setStageDescription(dto.stageDescription());
            stage.setStatus(dto.status() != null ? dto.status() : "PLANNED");
            stage.setStartDate(dto.startDate());
            stage.setEndDate(dto.endDate());

            if (stage.getOrderIndex() == null) {
                Integer maxOrder = dataManager.loadValue(
                                "select max(s.orderIndex) from CaseStage s where s.process.id = :processId",
                                Integer.class)
                        .parameter("processId", stage.getProcess().getId())
                        .one();
                stage.setOrderIndex(maxOrder != null ? maxOrder + 1 : 0);
            }

            CaseStage savedStage = dataManager.save(stage);
            return savedStage.getId().toString();
        } catch (Exception e) {
            log.error("Error saving stage", e);
            throw new RuntimeException("Ошибка сохранения стадии: " + e.getMessage(), e);
        }
    }
//======================= new =====================
@ClientCallable
public void createProcess(String processJson) {
    try {
        log.info("Attempting to create process");


        JsonNode jsonNode = objectMapper.readTree(processJson);

        Process process = dataManager.create(Process.class);
        process.setProcessName(jsonNode.get("processName").asText());
        process.setProcessDescription(jsonNode.has("processDescription") ?
                jsonNode.get("processDescription").asText() : null);
        process.setStatus(jsonNode.get("status").asText());

        if (jsonNode.has("deal") && jsonNode.get("deal").has("id")) {
            UUID dealId = UUID.fromString(jsonNode.get("deal").get("id").asText());
            Deal deal = dataManager.load(Deal.class).id(dealId).one();
            process.setDeal(deal);
        }

        dataManager.save(process);
    } catch (Exception e) {
        log.error("Error creating process", e);
        throw new RuntimeException("Error creating process", e);
    }
}

    @ClientCallable
    public void updateProcess(String processJson) {
        try {
            log.info("Attempting to update process");

            JsonNode jsonNode = objectMapper.readTree(processJson);
            UUID processId = UUID.fromString(jsonNode.get("id").asText());

            Process process = dataManager.load(Process.class).id(processId).one();
            process.setProcessName(jsonNode.get("processName").asText());
            process.setProcessDescription(jsonNode.has("processDescription") ?
                    jsonNode.get("processDescription").asText() : null);
            process.setStatus(jsonNode.get("status").asText());

            dataManager.save(process);
        } catch (Exception e) {
            log.error("Error updating process", e);
            throw new RuntimeException("Error updating process", e);
        }
    }
    //======================= new =====================


    @ClientCallable
    public void deleteStage(String stageId) {
        try {
            CaseStage stage = dataManager.load(CaseStage.class).id(UUID.fromString(stageId)).one();
            dataManager.remove(stage);
        } catch (Exception e) {
            log.error("Error deleting stage", e);
            throw new RuntimeException("Ошибка удаления стадии", e);
        }
    }

    // DTO классы
    public record StageOrderUpdate(String id, int orderIndex) {}
    public record StageDto(
            String id,
            String processId,
            String stageName,
            String stageDescription,
            String status,
            LocalDate startDate,
            LocalDate endDate
    ) {}
}