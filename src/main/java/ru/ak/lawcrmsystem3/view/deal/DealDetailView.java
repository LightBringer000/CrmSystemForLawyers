package ru.ak.lawcrmsystem3.view.deal;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.router.Route;
import io.jmix.core.FileRef;
import io.jmix.core.FileStorageLocator;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.ViewNavigators;
import io.jmix.flowui.component.grid.DataGrid;
import io.jmix.flowui.download.Downloader;
import io.jmix.flowui.kit.component.button.JmixButton;
import io.jmix.flowui.model.InstanceContainer;
import io.jmix.flowui.view.*;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.entity.Deal;
import ru.ak.lawcrmsystem3.entity.Document;
import ru.ak.lawcrmsystem3.view.main.MainView;

@Route(value = "deals/:id", layout = MainView.class)
@ViewController(id = "Deal.detail")
@ViewDescriptor(path = "deal-detail-view.xml")
@EditedEntityContainer("dealDc")
public class DealDetailView extends StandardDetailView<Deal> {


    @ViewComponent
    private InstanceContainer<Deal> dealDc;

    @ViewComponent
    private JmixButton viewDealStagesBtn;

    @Autowired
    private ViewNavigators viewNavigators;

    @Autowired
    private Notifications notifications;


    @ViewComponent
    private DataGrid<Document> relatedDocumentsDataGrid;

    @Autowired
    private FileStorageLocator fileStorageLocator;

    @Autowired
    private Downloader downloader; // Внедряем Downloader


    @Subscribe
    public void onInit(final InitEvent event) {
        relatedDocumentsDataGrid.addComponentColumn(document -> {
            if (document.getFile() != null) {
                FileRef fileRef = document.getFile();

                // Create a Button that looks like a link or just has the text
                Button downloadButton = new Button(document.getTitle());
                // Optional: Make it look like a link with CSS
                // downloadButton.addThemeVariants(ButtonVariant.LUMO_TERTIARY);

                downloadButton.addClickListener(clickEvent -> {
                    downloader.download(fileRef); // Trigger the download
                });

                return downloadButton;
            } else {
                return new Span(document.getTitle()); // If no file, just show the title as text
            }
        }) .setKey("documentTitle").setHeader("Название документа");
    }

    @Subscribe("viewDealStagesBtn")
    public void onViewDealStagesBtnClick(final ClickEvent<JmixButton> event) {
        Deal currentDeal = dealDc.getItemOrNull();

        if (currentDeal != null && currentDeal.getId() != null) {
            // Формируем URL вручную
            String url = "process-view/" + currentDeal.getId().toString();
            UI.getCurrent().navigate(url);
        } else {
            notifications.show("Выберите дело для просмотра процессов");
        }
    }

//    @Subscribe("viewDealStagesBtn")
//    public void onViewDealStagesBtnClick(final ClickEvent<JmixButton> event) {
//        Deal currentDeal = dealDc.getItemOrNull();
//
//        if (currentDeal != null && currentDeal.getId() != null) {
//            // Используем RouteParameters с именем параметра, указанным в @Route
//            RouteParameters parameters = new RouteParameters(
//                    Collections.singletonMap("dealId", currentDeal.getId().toString())
//            );
//
//            viewNavigators.view(this, ProcessDetailView.class)
//                    .withRouteParameters(parameters)
//                    .navigate();
//        } else {
//            notifications.show("Выберите дело для просмотра процессов");
//        }
//    }


//    @Subscribe("viewDealStagesBtn")
//    public void onViewDealStagesBtnClick(final ClickEvent<JmixButton> event) {
//        Deal currentDeal = dealDc.getItemOrNull();
//
//        if (currentDeal != null && currentDeal.getId() != null) {
//            // Переходим на страницу стадий с параметром dealId
//            viewNavigators.view(this, CaseStageView.class)
//                    .withRouteParameters(new RouteParameters(
//                            Collections.singletonMap("dealId", currentDeal.getId().toString())
//                    ))
//                    .navigate();
//
//            // Можно также сразу передать dealId во фронтенд
//            UI.getCurrent().getPage().executeJs(
//                    "window.setDealId($0)",
//                    currentDeal.getId().toString()
//            );
//        } else {
//            notifications.show("Выберите дело для просмотра стадий.");
//        }
//    }
//
}