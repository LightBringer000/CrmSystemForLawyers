package ru.ak.lawcrmsystem3.view.emailentitybrowse;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.EmailEntityBrowse;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "email-entity-browses", layout = MainView.class)
@ViewController(id = "EmailEntityBrowse.list")
@ViewDescriptor(path = "email-entity-browse-list-view.xml")
@LookupComponent("emailEntityBrowsesDataGrid")
@DialogMode(width = "64em")
public class EmailEntityBrowseListView extends StandardListView<EmailEntityBrowse> {


}