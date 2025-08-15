package ru.ak.lawcrmsystem3.view.client;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.Client;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "clients", layout = MainView.class)
@ViewController(id = "Client.list")
@ViewDescriptor(path = "client-list-view.xml")
@LookupComponent("clientsDataGrid")
@DialogMode(width = "64em")
public class ClientListView extends StandardListView<Client> {
}