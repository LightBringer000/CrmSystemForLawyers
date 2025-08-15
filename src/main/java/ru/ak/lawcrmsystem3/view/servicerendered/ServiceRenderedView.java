package ru.ak.lawcrmsystem3.view.servicerendered;


import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.router.Route;
import io.jmix.flowui.component.layout.ViewLayout;
import io.jmix.flowui.view.StandardView;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Route(value = "ServiceRenderedView", layout = MainView.class)
@ViewController(id = "Servicerenderedview")
@ViewDescriptor(path = "ServiceRenderedView.xml")

public class ServiceRenderedView extends StandardView {

    private static final Logger log = LoggerFactory.getLogger(ServiceRenderedView.class);

    public ServiceRenderedView() {
        String htmlContent = loadHtmlContent("/static/serviceRendered.html");
        Html html = new Html(htmlContent);
        getContent().add(html);
    }


    @Override
    @NonNull
    protected ViewLayout initContent() {
        ViewLayout content = super.initContent();

        // Динамическая загрузка JavaScript-файла
        Page page = UI.getCurrent().getPage();
        page.addJavaScript("/js/serviceRendered.js");

        return content;
    }

    private String loadHtmlContent(String resourcePath) {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IOException("HTML file not found: " + resourcePath);
            }
            byte[] bytes = inputStream.readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load HTML file", e);
        }
    }
}