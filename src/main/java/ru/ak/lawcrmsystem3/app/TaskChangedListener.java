package ru.ak.lawcrmsystem3.app;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jmix.core.DataManager;
import io.jmix.core.event.EntityChangedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.ak.lawcrmsystem3.entity.KanbanState;
import ru.ak.lawcrmsystem3.entity.Task;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class TaskChangedListener {

    @Autowired
    private DataManager dataManager;


    @Autowired
    private ObjectMapper objectMapper; // Jackson ObjectMapper

    @EventListener
    @Transactional
    public void onTaskChanged(EntityChangedEvent<Task> event) {
        if (event.getType() != EntityChangedEvent.Type.DELETED) {
            Task task = dataManager.load(Task.class)
                    .id(event.getEntityId())
                    .one();
            updateKanbanStatesWithTask(task);
        }
    }

    private void updateKanbanStatesWithTask(Task task) {
        // Получаем все KanbanState
        List<KanbanState> allKanbanStates = dataManager.load(KanbanState.class)
                .all()
                .list();

        // Фильтруем те, которые содержат нашу задачу
        List<KanbanState> kanbanStatesToUpdate = allKanbanStates.stream()
                .filter(ks -> {
                    try {
                        if (ks.getStateJson() == null || ks.getStateJson().isEmpty()) {
                            return false;
                        }
                        // Парсим JSON в List<Map>
                        List<Map<String, Object>> stateJsonList = objectMapper.readValue(
                                ks.getStateJson(),
                                new TypeReference<List<Map<String, Object>>>() {});

                        // Проверяем, содержит ли JSON нашу задачу
                        return stateJsonList.stream()
                                .anyMatch(item -> task.getId().toString().equals(item.get("id")));
                    } catch (Exception e) {
                        throw new RuntimeException("Error parsing stateJson", e);
                    }
                })
                .toList();

        // Обновляем найденные KanbanState
        for (KanbanState kanbanState : kanbanStatesToUpdate) {
            try {
                // Парсим JSON
                List<Map<String, Object>> stateJsonList = objectMapper.readValue(
                        kanbanState.getStateJson(),
                        new TypeReference<List<Map<String, Object>>>() {});

                // Обновляем задачу в JSON
                List<Map<String, Object>> updatedJsonList = stateJsonList.stream()
                        .map(item -> {
                            if (task.getId().toString().equals(item.get("id"))) {
                                return taskToJsonObject(task);
                            }
                            return item;
                        })
                        .collect(Collectors.toList());

                // Сериализуем обратно в JSON строку
                String updatedStateJson = objectMapper.writeValueAsString(updatedJsonList);
                kanbanState.setStateJson(updatedStateJson);
                dataManager.save(kanbanState);
            } catch (Exception e) {
                throw new RuntimeException("Error updating KanbanState", e);
            }
        }
    }

    private Map<String, Object> taskToJsonObject(Task task) {
        Map<String, Object> jsonObject = new HashMap<>();
        jsonObject.put("id", task.getId().toString());
        jsonObject.put("title", task.getTaskTitle());
        jsonObject.put("status", task.getTaskStatus().name());
        jsonObject.put("priority", task.getTaskPriority().name());
        jsonObject.put("deadline", task.getDeadline());
        return jsonObject;
    }

}