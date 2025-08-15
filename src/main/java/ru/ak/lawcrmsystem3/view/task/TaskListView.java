package ru.ak.lawcrmsystem3.view.task;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.Task;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "tasks", layout = MainView.class)
@ViewController(id = "Task_.list")
@ViewDescriptor(path = "task-list-view.xml")
@LookupComponent("tasksDataGrid")
@DialogMode(width = "64em")
public class TaskListView extends StandardListView<Task> {
}