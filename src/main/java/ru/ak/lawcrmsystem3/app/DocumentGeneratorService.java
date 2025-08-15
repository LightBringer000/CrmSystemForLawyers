package ru.ak.lawcrmsystem3.app;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.LegalDocumentData;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class DocumentGeneratorService {


//    private static final String FONT_FAMILY = "Times New Roman";
//    private static final int FONT_SIZE = 12; // В пунктах
//    private static final double LINE_SPACING_MULTIPLIER = 1.15; // Интервал между строк
//    private static final int PARAGRAPH_LEFT_INDENT_EMU = (int) (1.20 * 360000); // 1.20 см в EMUs
//    private static final int SECTION_SPACING_AFTER = 500; // Дополнительный отступ между секциями (в TWIPs, 1/20 пункта)
//    private static final int LIST_ITEM_LEFT_INDENT_EMU = (int) (0.63 * 360000); // Примерно 0.63 см для стандартного списка
//
//    public void generateLegalDocument(LegalDocumentData data, String outputPath) throws IOException {
//        XWPFDocument document = new XWPFDocument();
//
//        // 1. Кому: (выравнивание по правому краю, без абзацного отступа)
//        if (StringUtils.isNotBlank(data.getTo())) {
//            createSimpleSection(document, "Кому:", data.getTo(), ParagraphAlignment.RIGHT, 0);
//        }
//
//        // 2. От кого: (по правому краю)
//        if (StringUtils.isNotBlank(data.getFrom())) {
//            createListSection(document, "От кого:", splitString(data.getFrom()), ParagraphAlignment.RIGHT);
//        }
//
//        // 3. Участники: (по правому краю)
//        if (StringUtils.isNotBlank(data.getParticipants())) {
//            createListSection(document, "Участники:", splitString(data.getParticipants()), ParagraphAlignment.RIGHT);
//        }
//
//        // 4. Дополнительная информация: (по правому краю)
//        if (StringUtils.isNotBlank(data.getOtherInfo())) {
//            createListSection(document, "Дополнительная информация:", splitString(data.getOtherInfo()), ParagraphAlignment.RIGHT);
//        }
//
//        // 5. Название документа (по центру)
//        if (StringUtils.isNotBlank(data.getTitle())) {
//            createTitle(document, data.getTitle());
//        }
//
//        // 6. Содержание документа (по ширине, с общим левым отступом)
//        if (StringUtils.isNotBlank(data.getContent())) {
//            createContent(document, data.getContent());
//        }
//        addSpaceBetweenSections(document); // Пробел после Содержания
//
//
//        // 7. Просительная часть (по ширине, с общим левым отступом)
//        if (StringUtils.isNotBlank(data.getRequests())) {
//            createRequestSection(document, splitString(data.getRequests()));
//        }
//        addSpaceBetweenSections(document); // Пробел после Просительной части
//
//
//        // 8. Приложения (по ширине, с общим левым отступом)
//        if (StringUtils.isNotBlank(data.getAttachments())) {
//            createAttachments(document, splitString(data.getAttachments()));
//        }
//
//        // Сохранение
//        try (FileOutputStream out = new FileOutputStream(outputPath)) {
//            document.write(out);
//        }
//        document.close();
//    }
//
//    /**
//     * Добавляет пустой параграф для создания пробела между секциями.
//     */
//    private void addSpaceBetweenSections(XWPFDocument document) {
//        XWPFParagraph paragraph = document.createParagraph();
//        paragraph.setSpacingAfter(SECTION_SPACING_AFTER);
//        paragraph.setSpacingLineRule(LineSpacingRule.AUTO);
//        paragraph.setSpacingBetween(LINE_SPACING_MULTIPLIER);
//    }
//
//    // Вспомогательный метод для настройки стандартных параметров параграфа
//    // Теперь принимает 'leftIndent' вместо 'firstLineIndent'
//    private XWPFParagraph setupParagraph(XWPFDocument document, ParagraphAlignment alignment, int leftIndent) {
//        XWPFParagraph paragraph = document.createParagraph();
//        paragraph.setAlignment(alignment);
//        paragraph.setSpacingLineRule(LineSpacingRule.AUTO);
//        paragraph.setSpacingBetween(LINE_SPACING_MULTIPLIER);
//
//        if (leftIndent > 0) {
//            paragraph.setIndentationLeft(leftIndent); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
//        } else {
//            paragraph.setIndentationLeft(0); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
//        }
//        // Сбрасываем отступ первой строки, чтобы он не конфликтовал
//        paragraph.setIndentationFirstLine(0);
//        return paragraph;
//    }
//
//    // Вспомогательный метод для настройки стандартных параметров Run
//    private void setupRun(XWPFRun run) {
//        run.setFontFamily(FONT_FAMILY);
//        run.setFontSize(FONT_SIZE);
//    }
//
//    private void createSimpleSection(XWPFDocument document, String sectionName, String content, ParagraphAlignment alignment, int leftIndent) {
//        // Simple sections (Кому) не нужны отступы, кроме случаев, когда они являются элементом списка.
//        // Передаем 0 для leftIndent, если не хотим общего левого отступа.
//        XWPFParagraph paragraph = setupParagraph(document, alignment, leftIndent);
//        paragraph.setSpacingAfter(200);
//
//        XWPFRun titleRun = paragraph.createRun();
//        setupRun(titleRun);
//        titleRun.setText(sectionName);
//        titleRun.setBold(true);
//
//        XWPFRun contentRun = paragraph.createRun();
//        setupRun(contentRun);
//        contentRun.setText(" " + content);
//    }
//
//    private void createListSection(XWPFDocument document, String sectionName, List<String> items, ParagraphAlignment alignment) {
//        XWPFParagraph titleParagraph = setupParagraph(document, alignment, 0); // Без отступа для заголовка списка
//        titleParagraph.setSpacingAfter(100);
//
//        XWPFRun titleRun = titleParagraph.createRun();
//        setupRun(titleRun);
//        titleRun.setText(sectionName);
//        titleRun.setBold(true);
//
//        for (String item : items) {
//            XWPFParagraph itemParagraph = setupParagraph(document, alignment, 0); // Начнем без левого отступа по умолчанию
//
//            if (alignment == ParagraphAlignment.RIGHT) {
//                // Для списков по правому краю, может потребоваться отступ от правого края
//                itemParagraph.setIndentationRight(LIST_ITEM_LEFT_INDENT_EMU);
//                // Если нужен висячий отступ (маркер левее текста), это сложнее с правым выравниванием
//            } else {
//                // Для обычных списков по левому краю используем висячий отступ
//                itemParagraph.setIndentationLeft(LIST_ITEM_LEFT_INDENT_EMU); // Левый отступ для всего параграфа
//                itemParagraph.setIndentationHanging(LIST_ITEM_LEFT_INDENT_EMU / 2); // Смещение первой строки влево (маркера)
//            }
//            itemParagraph.setSpacingAfter(100);
//
//            XWPFRun itemRun = itemParagraph.createRun();
//            setupRun(itemRun);
//            itemRun.setText("• " + item); // Маркер списка
//        }
//
//        setupParagraph(document, ParagraphAlignment.LEFT, 0).setSpacingAfter(200);
//    }
//
//    private List<String> splitString(String input) {
//        if (input == null || input.trim().isEmpty()) {
//            return Collections.emptyList();
//        }
//
//        return Arrays.stream(input.split("\n"))
//                .map(String::trim)
//                .filter(s -> !s.isEmpty())
//                .collect(Collectors.toList());
//    }
//
//    private void createTitle(XWPFDocument document, String titleText) {
//        XWPFParagraph title = setupParagraph(document, ParagraphAlignment.CENTER, 0);
//        title.setSpacingAfter(300);
//        XWPFRun titleRun = title.createRun();
//        setupRun(titleRun);
//        titleRun.setText(titleText);
//        titleRun.setBold(true);
//        titleRun.setFontSize(14);
//    }
//
//    // Изменен, чтобы использовать leftIndent вместо firstLineIndent
//    private void createParagraphWithIndent(XWPFDocument document, String text, ParagraphAlignment alignment, int leftIndent) {
//        XWPFParagraph paragraph = setupParagraph(document, alignment, leftIndent); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
//        XWPFRun run = paragraph.createRun();
//        setupRun(run);
//        run.setText(text);
//    }
//
//    private void createContent(XWPFDocument document, String content) {
//        List<String> paragraphs = splitString(content);
//        for (String paraText : paragraphs) {
//            createParagraphWithIndent(document, paraText, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
//        }
//    }
//
//    private void createRequestSection(XWPFDocument document, List<String> requests) {
//        XWPFParagraph titleParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0);
//        XWPFRun titleRun = titleParagraph.createRun();
//        setupRun(titleRun);
//        titleRun.setText("ПРОШУ:");
//        titleRun.setBold(true);
//
//        for (int i = 0; i < requests.size(); i++) {
//            // ИЗМЕНЕНИЕ: Используем общий левый отступ
//            XWPFParagraph requestParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
//            XWPFRun requestRun = requestParagraph.createRun();
//            setupRun(requestRun);
//            requestRun.setText((i + 1) + ". " + requests.get(i));
//        }
//    }
//
//    private void createAttachments(XWPFDocument document, List<String> attachments) {
//        XWPFParagraph titleParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0);
//        XWPFRun titleRun = titleParagraph.createRun();
//        setupRun(titleRun);
//        titleRun.setText("Приложения:");
//        titleRun.setBold(true);
//
//        for (int i = 0; i < attachments.size(); i++) {
//            // ИЗМЕНЕНИЕ: Используем общий левый отступ
//            XWPFParagraph attachmentParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
//            XWPFRun attachmentRun = attachmentParagraph.createRun();
//            setupRun(attachmentRun);
//            attachmentRun.setText((i + 1) + ". " + attachments.get(i));
//        }
//    }


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

    private void createContent(XWPFDocument document, String content) {
        List<String> paragraphs = splitString(content);
        for (String paraText : paragraphs) {
            // Для содержания используем общий левый отступ И отступ первой строки
            createParagraphWithIndent(document, paraText, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
        }
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