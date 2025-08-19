package ru.ak.lawcrmsystem3.app;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.LegalDocumentData;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Component
public class DocumentGeneratorService {

    private static final String FONT_FAMILY = "Times New Roman";
    private static final int FONT_SIZE = 12; // В пунктах
    private static final double LINE_SPACING_MULTIPLIER = 1.15; // Интервал между строк
    private static final int PARAGRAPH_LEFT_INDENT_EMU = (int) (1.20 * 360000); // 1.20 см в EMUs для ОБЩЕГО левого отступа
    private static final int PARAGRAPH_FIRST_LINE_INDENT_EMU = (int) (1.20 * 360000); // 1.20 см в EMUs для отступа ПЕРВОЙ СТРОКИ
    private static final int SECTION_SPACING_AFTER = 500; // Дополнительный отступ между секциями (в TWIPs, 1/20 пункта)
    private static final int LIST_ITEM_LEFT_INDENT_EMU = (int) (0.63 * 360000); // Примерно 0.63 см для стандартного списка

    public void generateLegalDocument(LegalDocumentData data, String outputPath) throws IOException {
        XWPFDocument document = new XWPFDocument();

        // 1. Кому: (выравнивание по правому краю, без абзацного отступа)
        if (StringUtils.isNotBlank(data.getTo())) {
            // Для "Кому" не нужен общий отступ, и отступ первой строки тоже не нужен.
            createSimpleSection(document, "Кому:", data.getTo(), ParagraphAlignment.RIGHT, 0, 0);
        }
        // 2. От кого: (по правому краю)
        if (StringUtils.isNotBlank(data.getFrom())) {
            createListSection(document, "От кого:", splitString(data.getFrom()), ParagraphAlignment.RIGHT);
        }
        // 3. Участники: (по правому краю)
        if (StringUtils.isNotBlank(data.getParticipants())) {
            createListSection(document, "Участники:", splitString(data.getParticipants()), ParagraphAlignment.RIGHT);
        }
        // 4. Дополнительная информация: (по правому краю)
        if (StringUtils.isNotBlank(data.getOtherInfo())) {
            createListSection(document, "Дополнительная информация:", splitString(data.getOtherInfo()), ParagraphAlignment.RIGHT);
        }
        // 5. Название документа (по центру)
        if (StringUtils.isNotBlank(data.getTitle())) {
            createTitle(document, data.getTitle());
        }
        // 6. Содержание документа (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getContent())) {
            createContent(document, data.getContent());
        }
        addSpaceBetweenSections(document); // Пробел после Содержания

        // 7. Просительная часть (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getRequests())) {
            createRequestSection(document, splitString(data.getRequests()));
        }
        addSpaceBetweenSections(document); // Пробел после Просительной части

        // 8. Приложения (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getAttachments())) {
            createAttachments(document, splitString(data.getAttachments()));
        }
        // 9. Подписанты (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getSignatories())) {
            createSignatories(document, splitString(data.getSignatories()));
        }
        // Сохранение
        try (FileOutputStream out = new FileOutputStream(outputPath)) {
            document.write(out);
        }
        document.close();
    }

    /**
     * Добавляет пустой параграф для создания пробела между секциями.
     */
    private void addSpaceBetweenSections(XWPFDocument document) {
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setSpacingAfter(SECTION_SPACING_AFTER);
        paragraph.setSpacingLineRule(LineSpacingRule.AUTO);
        // setSpacingBetween используется для множителя интервала, а не для конкретного значения.
        // Для double множителя используйте setSpacingBetween с STLineSpacingRule.AT_LEAST или AUTO.
        // Здесь используем STLineSpacingRule.AUTO для гибкости.
        paragraph.setSpacingBetween(LINE_SPACING_MULTIPLIER * 240); // 1 point = 20 TWIPs, 1 TWIP = 1/20 point. 240 EMU per point.
        // Умножаем на 240, чтобы получить TWIPs для множителя
    }

    // Вспомогательный метод для настройки стандартных параметров параграфа
    // Теперь принимает 'leftIndent' (общий левый) и 'firstLineIndent' (отступ первой строки)
    private XWPFParagraph setupParagraph(XWPFDocument document, ParagraphAlignment alignment, int leftIndent, int firstLineIndent) {
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setAlignment(alignment);
        paragraph.setSpacingLineRule(LineSpacingRule.AUTO);
        paragraph.setSpacingBetween(LINE_SPACING_MULTIPLIER); // Интервал между строк

        // Общий левый отступ для всего абзаца
        if (leftIndent > 0) {
            paragraph.setIndentationLeft(leftIndent);
        } else {
            paragraph.setIndentationLeft(0);
        }

        // Отступ первой строки
        // Положительное значение для обычного отступа, отрицательное для висячего
        paragraph.setIndentationFirstLine(firstLineIndent);
        return paragraph;
    }

    // Вспомогательный метод для настройки стандартных параметров Run
    private void setupRun(XWPFRun run) {
        run.setFontFamily(FONT_FAMILY);
        run.setFontSize(FONT_SIZE);
    }

    // Изменена сигнатура, чтобы передавать firstLineIndent
    private void createSimpleSection(XWPFDocument document, String sectionName, String content, ParagraphAlignment alignment, int leftIndent, int firstLineIndent) {
        // Simple sections (Кому) не нужны отступы, кроме случаев, когда они являются элементом списка.
        // Передаем 0 для leftIndent и firstLineIndent, если не хотим отступов.
        XWPFParagraph paragraph = setupParagraph(document, alignment, leftIndent, firstLineIndent);
        paragraph.setSpacingAfter(200);

        XWPFRun titleRun = paragraph.createRun();
        setupRun(titleRun);
        titleRun.setText(sectionName);
        titleRun.setBold(true);

        XWPFRun contentRun = paragraph.createRun();
        setupRun(contentRun);
        contentRun.setText(" " + content);
    }

    private void createListSection(XWPFDocument document, String sectionName, List<String> items, ParagraphAlignment alignment) {
        // Для заголовка списка не нужен общий отступ или отступ первой строки
        XWPFParagraph titleParagraph = setupParagraph(document, alignment, 0, 0);
        titleParagraph.setSpacingAfter(100);

        XWPFRun titleRun = titleParagraph.createRun();
        setupRun(titleRun);
        titleRun.setText(sectionName);
        titleRun.setBold(true);

        for (String item : items) {
            // Для элементов списка по умолчанию начинаем без общего левого отступа
            XWPFParagraph itemParagraph = setupParagraph(document, alignment, 0, 0);

            if (alignment == ParagraphAlignment.RIGHT) {
                // Для списков по правому краю, может потребоваться отступ от правого края
                itemParagraph.setIndentationRight(LIST_ITEM_LEFT_INDENT_EMU);
                // Если нужен висячий отступ (маркер левее текста), это сложнее с правым выравниванием
                // В этом случае отступ первой строки будет отрицательным относительно setIndentationRight.
                // Для простоты, здесь оставим только правый отступ.
            } else {
                // Для обычных списков по левому краю используем висячий отступ
                itemParagraph.setIndentationLeft(LIST_ITEM_LEFT_INDENT_EMU); // Левый отступ для всего параграфа
                itemParagraph.setIndentationHanging(LIST_ITEM_LEFT_INDENT_EMU); // Смещение первой строки влево (маркера) - делаем его равным левому отступу для правильного выравнивания маркера.
            }
            itemParagraph.setSpacingAfter(100);

            XWPFRun itemRun = itemParagraph.createRun();
            setupRun(itemRun);
            itemRun.setText("• " + item); // Маркер списка
        }

        // Пробел после списка
        XWPFParagraph spaceParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0, 0);
        spaceParagraph.setSpacingAfter(200);
    }


    private List<String> splitString(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.stream(input.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private void createTitle(XWPFDocument document, String titleText) {
        // Для заголовка не нужен общий отступ или отступ первой строки
        XWPFParagraph title = setupParagraph(document, ParagraphAlignment.CENTER, 0, 0);
        title.setSpacingAfter(300);
        XWPFRun titleRun = title.createRun();
        setupRun(titleRun);
        titleRun.setText(titleText);
        titleRun.setBold(true);
        titleRun.setFontSize(14);
    }

    // Изменен, чтобы использовать leftIndent и firstLineIndent
    private void createParagraphWithIndent(XWPFDocument document, String text, ParagraphAlignment alignment, int leftIndent, int firstLineIndent) {
        XWPFParagraph paragraph = setupParagraph(document, alignment, leftIndent, firstLineIndent);
        XWPFRun run = paragraph.createRun();
        setupRun(run);
        run.setText(text);
    }

private void createContent(XWPFDocument document, String contentHtml) throws IOException {
    org.jsoup.nodes.Document doc = Jsoup.parse(contentHtml);

    // Проходим по всем узлам (элементам и тексту) в <body>
    for (org.jsoup.nodes.Node node : doc.body().childNodes()) {
        if (node instanceof TextNode) {
            // Создаём параграф для текстовых узлов верхнего уровня
            String text = ((TextNode) node).text();
            if (!text.trim().isEmpty()) {
                XWPFParagraph paragraph = document.createParagraph();
                XWPFRun run = paragraph.createRun();
                run.setText(text);
            }
        } else if (node instanceof Element) {
            Element element = (Element) node;
            String tagName = element.tagName();

            if (tagName.equals("p") || tagName.matches("h[1-6]")) {
                // Если это абзац или заголовок, создаём новый параграф и применяем форматирование
                XWPFParagraph paragraph = document.createParagraph();
                applyFormattingAndText(paragraph, element);
            } else if (tagName.equals("ul")) {
                createList(document, element, ListType.BULLETED);
            } else if (tagName.equals("ol")) {
                createList(document, element, ListType.NUMBERED);
            } else if (tagName.equals("img")) {
                createImageFromHtml(document, element);
            } else if (tagName.equals("pre")) {
                createTableFromPre(document, element);
            } else if (tagName.equals("table")) {
                createTableFromHtml(document, element);
            }
        }
    }
}

    /**
     * Создает изображение в документе Word из HTML-элемента <img>.
     */
    private void createImageFromHtml(XWPFDocument document, Element imgElement) {
        String src = imgElement.attr("src");
        if (src.startsWith("data:image")) {
            System.out.println("Найден тег <img> с данными Base64.");

            String[] parts = src.split(",");
            String mimeType = parts[0].split(":")[1].split(";")[0];
            String base64Data = parts[1];

            System.out.println("MIME Type: " + mimeType);

            try {
                byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                System.out.println("Размер данных изображения (в байтах): " + imageBytes.length);

                BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
                if (originalImage == null) {
                    System.err.println("Ошибка: не удалось прочитать данные изображения в BufferedImage.");
                    return;
                }
                System.out.println("Изображение успешно прочитано. Размеры: " + originalImage.getWidth() + "x" + originalImage.getHeight());

                int originalWidth = originalImage.getWidth();
                int originalHeight = originalImage.getHeight();
                int desiredWidthInPx = 450;
                int desiredHeightInPx = (int) ((double) originalHeight * desiredWidthInPx / originalWidth);

                XWPFParagraph paragraph = document.createParagraph();
                paragraph.setAlignment(ParagraphAlignment.CENTER);

                XWPFRun run = paragraph.createRun();
                int pictureType = getPictureType(mimeType);
                System.out.println("Полученный тип изображения: " + pictureType);

                run.addPicture(
                        new ByteArrayInputStream(imageBytes),
                        pictureType,
                        "image." + mimeType.substring(mimeType.lastIndexOf("/") + 1),
                        Units.toEMU(desiredWidthInPx),
                        Units.toEMU(desiredHeightInPx)
                );
                System.out.println("Изображение успешно добавлено в документ.");
            } catch (IOException e) {
                System.err.println("Ошибка обработки данных изображения: " + e.getMessage());
                e.printStackTrace();
            } catch (Exception e) {
                System.err.println("Непредвиденная ошибка при обработке элемента: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("Найден тег <img> без данных Base64. Пропускаем.");
        }
    }

    private void createTableFromPre(XWPFDocument document, Element preElement) {
        // Извлекаем чистый текст, сохраняя переносы строк
        String preText = preElement.text();
        String[] lines = preText.split("\n");

        if (lines.length == 0) {
            return; // Если текста нет, выходим
        }

        XWPFTable table = document.createTable();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];

            // Разделяем строку на ячейки по одному или нескольким пробелам
            String[] cells = line.trim().split("\\s{2,}"); // Два или более пробела как разделитель

            XWPFTableRow tableRow = (i == 0) ? table.getRow(0) : table.createRow();

            for (int j = 0; j < cells.length; j++) {
                String cellText = cells[j];
                XWPFTableCell tableCell = (j == 0 && i == 0) ? tableRow.getCell(0) : tableRow.addNewTableCell();

                // Удаляем существующие пустые параграфы в ячейке
                for (int k = tableCell.getParagraphs().size() - 1; k >= 0; k--) {
                    tableCell.removeParagraph(k);
                }

                // Создаем новый параграф и добавляем текст из ячейки
                XWPFParagraph paragraph = tableCell.addParagraph();
                XWPFRun run = paragraph.createRun();
                run.setText(cellText);
            }
        }
    }

    /**
     * Рекурсивно проходит по дочерним узлам HTML-элемента, создавая XWPFRun
     * и применяя соответствующее форматирование.
     */
    private void applyFormattingAndText(XWPFParagraph paragraph, Element element) {
        for (org.jsoup.nodes.Node node : element.childNodes()) {
            if (node instanceof TextNode) {
                String text = ((TextNode) node).text();
                if (StringUtils.isNotBlank(text)) {
                    XWPFRun run = paragraph.createRun();
                    setupRun(run);
                    run.setText(text);
                }
            } else if (node instanceof Element) {

                Element childElement = (Element) node;
                // Если это изображение, обрабатываем его здесь
                if (childElement.tagName().equals("img")) {
                    // Создаем новый параграф для изображения, так как оно обычно на отдельной строке
                    XWPFParagraph imgParagraph = paragraph.getDocument().createParagraph();
                    createImageFromHtml(paragraph.getDocument(), childElement);
                }



                XWPFRun run = paragraph.createRun();
                setupRun(run);

                // Применяем форматирование
                if (childElement.tagName().equals("b") || childElement.tagName().equals("strong")) {
                    run.setBold(true);
                }
                if (childElement.tagName().equals("i") || childElement.tagName().equals("em")) {
                    run.setItalic(true);
                }
                if (childElement.tagName().equals("u")) {
                    run.setUnderline(UnderlinePatterns.SINGLE);
                }
                if (childElement.tagName().equals("s") || childElement.tagName().equals("del")) {
                    run.setStrike(true);
                }
                // 💡 Исправленная логика для нижнего индекса
                if (childElement.tagName().equals("sub")) {
                    run.setSubscript(VerticalAlign.SUBSCRIPT);
                }
                // 💡 Исправленная логика для верхнего индекса
                if (childElement.tagName().equals("sup")) {
                    run.setSubscript(VerticalAlign.SUPERSCRIPT);
                }

                // Обработка ссылок
                if (childElement.tagName().equals("a")) {
                    run.setText(childElement.text());
                    run.setUnderline(UnderlinePatterns.SINGLE);
                    run.setColor("0000FF"); // Синий цвет для ссылок
                    // Чтобы сделать гиперссылку рабочей, нужно использовать другой подход,
                    // это только визуальное оформление.
                } else {
                    // Рекурсивный вызов для вложенных элементов
                    applyFormattingAndText(paragraph, childElement);
                }
            }
        }
    }

    private enum ListType {
        BULLETED,
        NUMBERED
    }

    /**
     * Создает список (маркированный или нумерованный) из HTML-элементов <ul> или <ol>.
     */
    private void createList(XWPFDocument document, Element listElement, ListType type) {
        // Получаем или создаем новый стиль нумерации
        BigInteger abstractNumId;
        if (type == ListType.BULLETED) {
            XWPFAbstractNum abstractNum = createAbstractNumForBullet(document);
            abstractNumId = document.getNumbering().addAbstractNum(abstractNum);
        } else {
            XWPFAbstractNum abstractNum = createAbstractNumForNumbered(document);
            abstractNumId = document.getNumbering().addAbstractNum(abstractNum);
        }

        for (Element listItem : listElement.children()) {
            if (listItem.tagName().equals("li")) {
                XWPFParagraph paragraph = document.createParagraph();
                paragraph.setSpacingAfter(100);

                // Создаем новый CTNum и связываем его с abstractNumId
                CTNum ctNum = CTNum.Factory.newInstance();
                ctNum.addNewAbstractNumId().setVal(abstractNumId);
                ctNum.setNumId(BigInteger.valueOf(1)); // Устанавливаем уникальный ID для списка.

                // Используем addNum с объектом CTNum
                XWPFNum num = new XWPFNum(ctNum, document.getNumbering());
                document.getNumbering().addNum(num);

                // Привязываем параграф к этому стилю списка
                paragraph.setNumID(ctNum.getNumId());

                // Добавление текста элемента списка
                applyFormattingAndText(paragraph, listItem);
            }
        }
    }

    // Вспомогательные методы для создания стилей списков (нужны для Apache POI)
    private XWPFAbstractNum createAbstractNumForBullet(XWPFDocument document) {
        CTAbstractNum cTAbstractNum = CTAbstractNum.Factory.newInstance();
        cTAbstractNum.addNewLvl().addNewPPr().addNewNumPr().addNewIlvl().setVal(BigInteger.valueOf(0));
        cTAbstractNum.getLvlArray(0).addNewPPr().addNewInd().setLeft(BigInteger.valueOf(720));
        cTAbstractNum.getLvlArray(0).getLvlText().setVal("•");
        cTAbstractNum.getLvlArray(0).getLvlJc().setVal(STJc.LEFT);
        cTAbstractNum.getLvlArray(0).addNewRPr().addNewRFonts().setHint(STHint.DEFAULT);

        // Добавляем CTAbstractNum в XWPFAbstractNum
        XWPFAbstractNum abstractNum = new XWPFAbstractNum(cTAbstractNum);
        return abstractNum;
    }

    private XWPFAbstractNum createAbstractNumForNumbered(XWPFDocument document) {
        CTAbstractNum cTAbstractNum = CTAbstractNum.Factory.newInstance();
        cTAbstractNum.addNewLvl().addNewPPr().addNewNumPr().addNewIlvl().setVal(BigInteger.valueOf(0));
        cTAbstractNum.getLvlArray(0).getLvlText().setVal("%1.");
        cTAbstractNum.getLvlArray(0).getLvlJc().setVal(STJc.LEFT);
        cTAbstractNum.getLvlArray(0).addNewPPr().addNewInd().setLeft(BigInteger.valueOf(720));
        cTAbstractNum.getLvlArray(0).addNewRPr().addNewRFonts().setHint(STHint.DEFAULT);

        // Добавляем CTAbstractNum в XWPFAbstractNum
        XWPFAbstractNum abstractNum = new XWPFAbstractNum(cTAbstractNum);
        return abstractNum;
    }

    private void createTableFromHtml(XWPFDocument document, Element tableElement) {
        XWPFTable table = document.createTable();
        table.setWidth("100%"); // Устанавливаем ширину таблицы в 100%

        // Проходим по строкам (tr) и ячейкам (td, th)
        Elements rows = tableElement.select("tr");
        for (int i = 0; i < rows.size(); i++) {
            Element rowElement = rows.get(i);
            XWPFTableRow tableRow = (i == 0) ? table.getRow(0) : table.createRow();

            Elements cells = rowElement.select("td, th");
            for (int j = 0; j < cells.size(); j++) {
                Element cellElement = cells.get(j);
                XWPFTableCell tableCell = (j == 0 && i == 0) ? tableRow.getCell(0) : tableRow.addNewTableCell();

                // Удаляем существующие пустые параграфы в ячейке перед добавлением текста
                for (int k = tableCell.getParagraphs().size() - 1; k >= 0; k--) {
                    tableCell.removeParagraph(k);
                }

                XWPFParagraph paragraph = tableCell.addParagraph();
                XWPFRun run = paragraph.createRun();
                setupRun(run);
                run.setText(cellElement.text());
            }
        }
    }


    private int getPictureType(String mimeType) {
        if (mimeType.contains("jpeg")) {
            return XWPFDocument.PICTURE_TYPE_JPEG;
        } else if (mimeType.contains("png")) {
            return XWPFDocument.PICTURE_TYPE_PNG;
        } else if (mimeType.contains("gif")) {
            return XWPFDocument.PICTURE_TYPE_GIF;
        }
        return XWPFDocument.PICTURE_TYPE_PICT;
    }


    private void createRequestSection(XWPFDocument document, List<String> requests) {
        // Для заголовка "ПРОШУ:" не нужен общий отступ или отступ первой строки
        XWPFParagraph titleParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0, 0);
        XWPFRun titleRun = titleParagraph.createRun();
        setupRun(titleRun);
        titleRun.setText("ПРОШУ:");
        titleRun.setBold(true);

        for (int i = 0; i < requests.size(); i++) {
            // Для пунктов просительной части используем общий левый отступ И отступ первой строки
            XWPFParagraph requestParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
            XWPFRun requestRun = requestParagraph.createRun();
            setupRun(requestRun);
            requestRun.setText((i + 1) + ". " + requests.get(i));
        }
    }

    private void createAttachments(XWPFDocument document, List<String> attachments) {
        // Для заголовка "Приложения:" не нужен общий отступ или отступ первой строки
        XWPFParagraph titleParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0, 0);
        XWPFRun titleRun = titleParagraph.createRun();
        setupRun(titleRun);
        titleRun.setText("Приложения:");
        titleRun.setBold(true);

        for (int i = 0; i < attachments.size(); i++) {
            // Для пунктов приложений используем общий левый отступ И отступ первой строки
            XWPFParagraph attachmentParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
            XWPFRun attachmentRun = attachmentParagraph.createRun();
            setupRun(attachmentRun);
            attachmentRun.setText((i + 1) + ". " + attachments.get(i));
        }
    }

    private void createSignatories(XWPFDocument document, List<String> signatories) {
        // Добавляем отступ перед секцией подписантов, если нужно
        addSpaceBetweenSections(document);

        for (String signatory : signatories) {
            // Для подписантов используем выравнивание по ширине (BOTH),
            // общий левый отступ и отступ первой строки,
            // аналогично основному содержанию.
            XWPFParagraph signatoryParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
            signatoryParagraph.setSpacingAfter(100); // Небольшой отступ после каждой строки подписанта

            XWPFRun signatoryRun = signatoryParagraph.createRun();
            setupRun(signatoryRun);
            signatoryRun.setText(signatory);
        }
    }
}