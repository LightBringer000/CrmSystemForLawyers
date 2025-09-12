package ru.ak.lawcrmsystem3.view.main;

import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.shared.Registration;
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

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Route("")
@ViewController(id = "MainView")
@ViewDescriptor(path = "main-view.xml")
public class MainView extends StandardMainView {
//
//    @Autowired
//    private SchedulerService schedulerService;
//
//    @Autowired
//    private ViewNavigationSupport viewNavigationSupport;
//
//    @ViewComponent
//    private Button tasksButton;
//
//    @Subscribe
//    public void onInit(final InitEvent event) {
//        long count = schedulerService.getIncompleteTasksCount();
//        updateTasksButton(count);
//    }
//
//    @Scheduled(fixedRate = 30000)
//    public void checkIncompleteTasks() {
//        getUI().ifPresent(ui -> ui.access(() -> {
//            long count = schedulerService.getIncompleteTasksCount();
//            updateTasksButton(count);
//        }));
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
//
//    @Subscribe("tasksButton")
//    public void onTasksButtonClick(final ClickEvent<JmixButton> event) {
//        viewNavigationSupport.navigate("Task_.list");
//    }
//

    @Autowired
    private SchedulerService schedulerService;

    @Autowired
    private ViewNavigationSupport viewNavigationSupport;

    @ViewComponent
    private Button tasksButton;

    private ScheduledExecutorService executor;
    private Registration detachRegistration;

    @Subscribe
    public void onInit(final InitEvent event) {
        // Начальный подсчёт при создании представления
        long count = schedulerService.getIncompleteTasksCount();
        updateTasksButton(count);
    }

    @Override
    protected void onAttach(AttachEvent attachEvent) {
        super.onAttach(attachEvent);
        UI ui = attachEvent.getUI();

        executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleAtFixedRate(() -> {
            ui.access(() -> {
                long count = schedulerService.getIncompleteTasksCount();
                updateTasksButton(count);
            });
        }, 0, 30, TimeUnit.SECONDS);

        detachRegistration = ui.addDetachListener(detachEvent -> {
            executor.shutdown();
        });
    }

    @Override
    protected void onDetach(DetachEvent detachEvent) {
        super.onDetach(detachEvent);
        if (executor != null && !executor.isShutdown()) {
            executor.shutdown();
        }
        if (detachRegistration != null) {
            detachRegistration.remove();
        }
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
