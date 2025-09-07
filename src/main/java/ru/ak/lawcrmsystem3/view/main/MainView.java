package ru.ak.lawcrmsystem3.view.main;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.router.Route;
import io.jmix.core.DataManager;
import io.jmix.flowui.ViewNavigators;
import io.jmix.flowui.app.main.StandardMainView;
import io.jmix.flowui.kit.component.button.JmixButton;
import io.jmix.flowui.view.Subscribe;
import io.jmix.flowui.view.ViewComponent;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import io.jmix.flowui.view.navigation.ViewNavigationSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import ru.ak.lawcrmsystem3.app.SchedulerService;
import ru.ak.lawcrmsystem3.entity.Task;

@Route("")
@ViewController(id = "MainView")
@ViewDescriptor(path = "main-view.xml")
public class MainView extends StandardMainView {


//@Autowired
//private SchedulerService schedulerService;

//    @ViewComponent
//    private Button tasksButton;
//
//    // Этот метод теперь выполняется в контексте MainView
//    @Scheduled(fixedRate = 30000)
//    public void checkIncompleteTasks() {
//        getUI().ifPresent(ui -> ui.access(() -> {
//            long count = schedulerService.getIncompleteTasksCount();
//            updateTasksButton(count);
//        }));
//    }
//
//    @Subscribe
//    public void onInit(final InitEvent event) {
//        // Вызовите метод один раз при инициализации
//        long count = schedulerService.getIncompleteTasksCount();
//        updateTasksButton(count);
//    }
//
//    public void updateTasksButton(long count) {
//        tasksButton.setVisible(count > 0);
//        if (count > 0) {
//            tasksButton.setText(String.format("У вас %d незавершённых задач", count));
//        } else {
//            tasksButton.setText("");
//        }
//    }

    @Autowired
    private SchedulerService schedulerService;

    @Autowired
    private ViewNavigationSupport viewNavigationSupport;

    @ViewComponent
    private Button tasksButton;

    @Subscribe
    public void onInit(final InitEvent event) {
        long count = schedulerService.getIncompleteTasksCount();
        updateTasksButton(count);
    }

    @Scheduled(fixedRate = 30000)
    public void checkIncompleteTasks() {
        getUI().ifPresent(ui -> ui.access(() -> {
            long count = schedulerService.getIncompleteTasksCount();
            updateTasksButton(count);
        }));
    }

    public void updateTasksButton(long count) {
        tasksButton.setVisible(count > 0);
        if (count > 0) {
            tasksButton.setText(String.format("У вас %d незавершённых задач", count));
        } else {
            tasksButton.setText("");
        }
    }

    @Subscribe("tasksButton")
    public void onTasksButtonClick(final ClickEvent<JmixButton> event) {
        viewNavigationSupport.navigate("Task_.list");
    }

}
