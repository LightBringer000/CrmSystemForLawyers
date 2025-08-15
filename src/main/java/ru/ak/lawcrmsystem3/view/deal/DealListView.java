package ru.ak.lawcrmsystem3.view.deal;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.Deal;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "deals", layout = MainView.class)
@ViewController(id = "Deal.list")
@ViewDescriptor(path = "deal-list-view.xml")
@LookupComponent("dealsDataGrid")
@DialogMode(width = "64em")
public class DealListView extends StandardListView<Deal> {
}