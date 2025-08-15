package ru.ak.lawcrmsystem3.view.interactionshistory;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.InteractionsHistory;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "interactions-histories", layout = MainView.class)
@ViewController(id = "InteractionsHistory.list")
@ViewDescriptor(path = "interactions-history-list-view.xml")
@LookupComponent("interactionsHistoriesDataGrid")
@DialogMode(width = "64em")
public class InteractionsHistoryListView extends StandardListView<InteractionsHistory> {
}