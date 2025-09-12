package ru.ak.lawcrmsystem3.view.task;

import com.vaadin.flow.router.Route;
import io.jmix.core.security.CurrentAuthentication;
import io.jmix.flowui.model.CollectionLoader;
import io.jmix.flowui.view.*;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.entity.Task;
import ru.ak.lawcrmsystem3.entity.User;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "tasks", layout = MainView.class)
@ViewController(id = "Task_.list")
@ViewDescriptor(path = "task-list-view.xml")
@LookupComponent("tasksDataGrid")
@DialogMode(width = "64em")
public class TaskListView extends StandardListView<Task> {

//    @Autowired
//    private CollectionLoader<Task> tasksDl;
//
//    @Autowired
//    private CurrentAuthentication currentAuthentication;
//
//    @Subscribe
//    public void onBeforeShow(BeforeShowEvent event) {
//        User currentUser = (User) currentAuthentication.getUser();
//        tasksDl.setParameter("current_user_username", currentUser.getUsername());
//        tasksDl.load();
//    }
}