package ru.ak.lawcrmsystem3.view.interactionshistory;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.EditedEntityContainer;
import io.jmix.flowui.view.StandardDetailView;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import ru.ak.lawcrmsystem3.entity.InteractionsHistory;
import ru.ak.lawcrmsystem3.view.main.MainView;

@Route(value = "interactions-histories/:id", layout = MainView.class)
@ViewController(id = "InteractionsHistory.detail")
@ViewDescriptor(path = "interactions-history-detail-view.xml")
@EditedEntityContainer("interactionsHistoryDc")
public class InteractionsHistoryDetailView extends StandardDetailView<InteractionsHistory> {
}