console.log('Script loaded, document state:', document.readyState);
console.log('emailListView.js started execution');

let emailTableBody;
let refreshButton;
let noEmailsMessage;
let errorMessage;
let serverView;
let newEmailBtn;
let emailListViewInitialized = false;
let observers = [];
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;

// Основная функция инициализации
function initializeEmailListView(force = false) {
    // Проверяем, находимся ли мы на нужной странице
    if (!isEmailListViewPage()) {
        console.log('Not on email list view page, skipping initialization');
        return;
    }

    if (emailListViewInitialized && !force) return;

    // Очистка предыдущих наблюдателей
    observers.forEach(observer => observer.disconnect());
    observers = [];

    initializationAttempts++;
    if (initializationAttempts > MAX_INIT_ATTEMPTS) {
        console.log('Max initialization attempts reached, giving up');
        return;
    }

    try {
        // 1. Находим элементы в DOM
        const elements = findEmailListElements();
        if (!elements) {
            console.log('Not all required elements found, retrying...');
            setTimeout(() => initializeEmailListView(force), 500);
            return;
        }

        ({emailTableBody, refreshButton, noEmailsMessage, errorMessage, newEmailBtn} = elements);
        console.log('All DOM elements found');

        // 2. Находим серверный View компонент
        serverView = findServerView();
        if (!serverView) {
            console.log('Server view not found yet, retrying...');
            setTimeout(() => initializeEmailListView(force), 500);
            return;
        }

        // 3. Настраиваем обработчики событий
        setupEventHandlers();

        // 4. Создаем/обновляем модальное окно
        createEmailModal();

        // 5. Первоначальная загрузка писем
        refreshEmailTable();

        // 6. Добавляем наблюдатели за изменениями
        setupObservers();

        emailListViewInitialized = true;
        initializationAttempts = 0; // Сбрасываем счетчик попыток после успешной инициализации

    } catch (error) {
        console.error('Initialization error:', error);
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Ошибка инициализации';
        }

        // Повторная попытка через 500 мс
        setTimeout(() => initializeEmailListView(force), 500);
    }
}

// Проверяем, находимся ли мы на странице просмотра писем
function isEmailListViewPage() {
    // Вариант 1: Проверка по URL
    if (window.location.pathname.includes('email-list-view')) {
        return true;
    }

    // Вариант 2: Проверка по наличию ключевого элемента
    if (document.getElementById('email-table-body')) {
        return true;
    }

    return false;
}

function findEmailListElements() {
    const emailTableBody = document.getElementById('email-table-body');
    const refreshButton = document.getElementById('refresh-button');
    const noEmailsMessage = document.getElementById('no-emails-message');
    const errorMessage = document.getElementById('error-message');
    const newEmailBtn = document.getElementById('newEmailBtn');

    if (!emailTableBody || !refreshButton || !noEmailsMessage || !errorMessage || !newEmailBtn) {
        return null;
    }

    return {emailTableBody, refreshButton, noEmailsMessage, errorMessage, newEmailBtn};
}

function findServerView() {
    const emailListViewElement = document.querySelector('[id="EmailListView"]');
    if (emailListViewElement && emailListViewElement.$server) {
        console.log('Server view initialized', emailListViewElement.$server);
        return emailListViewElement.$server;
    }
    console.error('Server view not found');
    return null;
}

function setupEventHandlers() {
    // Удаляем старые обработчики
    refreshButton.removeEventListener('click', refreshEmailTable);
    newEmailBtn.removeEventListener('click', showEmailModal);

    // Добавляем новые обработчики
    refreshButton.addEventListener('click', refreshEmailTable);
    newEmailBtn.addEventListener('click', showEmailModal);
    // Обработчик кнопки обновления
    document.getElementById('refresh-processes')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadProcesses();
        });
}

function setupObservers() {
    // Наблюдатель за изменениями в основном контейнере
    const mainObserver = new MutationObserver((mutations) => {
        if (!document.getElementById('email-table-body')) {
            console.log('Main container changed, reinitializing...');
            emailListViewInitialized = false;
            initializeEmailListView(true);
        }
    });

    mainObserver.observe(document.body, {childList: true, subtree: true});
    observers.push(mainObserver);

    // Наблюдатель за кнопками
    const buttonsObserver = new MutationObserver((mutations) => {
        if (!refreshButton.isConnected || !newEmailBtn.isConnected) {
            console.log('Buttons changed, reinitializing...');
            emailListViewInitialized = false;
            initializeEmailListView(true);
        }
    });

    if (refreshButton && newEmailBtn) {
        buttonsObserver.observe(refreshButton.parentNode, {childList: true});
        buttonsObserver.observe(newEmailBtn.parentNode, {childList: true});
        observers.push(buttonsObserver);
    }
}


// MutationObserver для отслеживания изменений DOM
const emailListObserver = new MutationObserver((mutations) => {
    const emailListViewElement = document.querySelector('[id="EmailListView"]');
    if (emailListViewElement && !emailListViewInitialized) {
        console.log('EmailListView element detected in DOM, initializing...');
        initializeEmailListView(true);
    }
});

// Начинаем наблюдение
emailListObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Обработчик навигации Vaadin (если используется)
if (window.Vaadin?.Flow?.navigation) {
    window.Vaadin.Flow.navigation.on('vaadin-navigated', (event) => {
        if (event.detail.route === 'email-list-view') {
            console.log('Email list route detected, reinitializing...');
            emailListViewInitialized = false;
            initializationAttempts = 0;
            initializeEmailListView(true);
        } else {
            // Если перешли на другую страницу - очищаем состояние
            console.log('Left email list view, cleaning up...');
            emailListViewInitialized = false;
            observers.forEach(observer => observer.disconnect());
            observers = [];
        }
    });
}


// Функция показа модального окна
function showEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Модальное окно не найдено');
        // Пересоздаем модальное окно, если оно было потеряно
        createEmailModal();
        document.getElementById('emailModal').style.display = 'block';
    }
}

// Функция обновления таблицы писем
async function refreshEmailTable() {
    try {
        const jsonString = await serverView.fetchEmailsForDisplay();
                console.log("Ответ сервера:", jsonString); // <- Логируем сырой ответ

                const emails = JSON.parse(jsonString);
                console.log("Список писем:", emails); // <- Логируем распарсенные данные

        emailTableBody.innerHTML = '';
     emails.forEach(email => {
         const row = emailTableBody.insertRow();
         row.style.cursor = 'pointer';

         // Заполнение ячеек
         row.insertCell().textContent = email.from;
         row.insertCell().textContent = email.subject;
         row.insertCell().textContent = formatDate(email.sentDate); // Форматируем дату отправки
         row.insertCell().textContent = formatDate(email.receivedDate); // Форматируем дату получения

         // Важно: передаём email.uid, а не весь email
         row.addEventListener('click', () => {
             if (!email.uid) {
                 console.error("UID не найден в объекте:", email);
                 alert("Ошибка: невозможно открыть письмо (отсутствует идентификатор)");
                 return;
             }
             showEmailDetails(email.uid); // <- Передаём только UID
         });
     });
    } catch (error) {
        console.error('Ошибка загрузки писем:', error);
    }
}

function createAttachmentLink(attachment, emailId) {

    const link = document.createElement('a');
    link.href = `/api/emails/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachment.id)}`;
    link.download = attachment.fileName;
    link.style.cssText = 'color: #2563eb; text-decoration: none; margin-right: 10px;';

    // Иконка в зависимости от типа файла
    const icon = document.createElement('i');
    icon.className = `fas ${getFileIcon(attachment.fileName)}`;
    icon.style.marginRight = '5px';

    // Изменяем текст ссылки
    const text = document.createTextNode(
        `${attachment.fileName} (${formatFileSize(attachment.fileSize)})`
    );

    link.appendChild(icon);
    link.appendChild(text);

    // Обработчик для проверки скачивания
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(link.href, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Создаем временную ссылку для скачивания
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.download = attachment.fileName;
            document.body.appendChild(tempLink);
            tempLink.click();

            // Очистка
            setTimeout(() => {
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download attachment: ' + error.message);
        }
    });

    return link;
}


async function showEmailDetails(uid) {
    try {
        // 1. Получаем данные письма с сервера
        const response = await serverView.getEmailContent(uid);
        const emailDetails = JSON.parse(response);

        if (emailDetails.error) {
            throw new Error(emailDetails.error);
        }

        // 2. Санитизация контента
        const cleanHtmlContent = emailDetails.htmlContent
            ? DOMPurify.sanitize(emailDetails.htmlContent)
            : null;

        const cleanTextContent = emailDetails.textContent
            ? DOMPurify.sanitize(escapeHtml(emailDetails.textContent)).replace(/\r\n/g, '<br>')
            : null;

        // 3. Создаем модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        // 4. Создаем контейнер для содержимого
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            background: white;
            width: 95%;
            max-width: 1200px;
            max-height: 95vh;
            padding: 20px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // 5. Добавляем заголовок и кнопку закрытия
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-shrink: 0;
        `;

        const title = document.createElement('h2');
        title.style.cssText = 'margin: 0; font-size: 1.5rem;';
        title.textContent = emailDetails.subject || 'No subject';

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
        `;
        closeButton.onclick = () => modal.remove();

        header.appendChild(title);
        header.appendChild(closeButton);

        // 6. Добавляем информацию об отправителе
        const senderInfo = document.createElement('div');
        senderInfo.style.cssText = 'margin-bottom: 15px; color: #555; flex-shrink: 0;';

        const from = document.createElement('div');
        from.innerHTML = `<strong>From:</strong> ${emailDetails.from || 'Unknown'}`;

        const date = document.createElement('div');
        //date.innerHTML = `<strong>Date:</strong> ${emailDetails.sentDate || 'Unknown'}`;
        date.innerHTML = `<strong>Date:</strong> ${formatDate(emailDetails.sentDate) || 'Unknown'}`;

        senderInfo.appendChild(from);
        senderInfo.appendChild(date);

        // 7. Создаем iframe для содержимого письма
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            flex-grow: 1;
            border: none;
            background: white;
            min-height: 200px;
            margin-bottom: 15px;
        `;

        // 8. Добавляем содержимое письма в iframe
        const iframeContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <base target="_blank">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 15px;
            margin: 0;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        img { max-width: 100%; height: auto; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    ${cleanHtmlContent || cleanTextContent || 'No content available'}
</body>
</html>`;

        // 9. Добавляем блок с вложениями (если они есть)
        if (emailDetails.attachments && emailDetails.attachments.length > 0) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.style.cssText = `
                margin-top: 10px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #ddd;
            `;

            const attachmentsTitle = document.createElement('p');
            attachmentsTitle.style.cssText = `
                margin: 0 0 10px 0;
                color: #666;
                font-weight: bold;
                display: flex;
                align-items: center;
            `;

            const paperclipIcon = document.createElement('i');
            paperclipIcon.className = 'fas fa-paperclip';
            paperclipIcon.style.marginRight = '5px';

            attachmentsTitle.appendChild(paperclipIcon);
            attachmentsTitle.appendChild(document.createTextNode('Attachments:'));

            const attachmentsList = document.createElement('div');
            attachmentsList.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            `;

            emailDetails.attachments.forEach(attachment => {
                const attachmentBtn = document.createElement('button');
                attachmentBtn.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 12px;
                    background-color: #e9ecef;
                    border-radius: 4px;
                    color: #2563eb;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.2s;
                `;

                attachmentBtn.addEventListener('mouseenter', () => {
                    attachmentBtn.style.backgroundColor = '#d1d7e0';
                });

                attachmentBtn.addEventListener('mouseleave', () => {
                    attachmentBtn.style.backgroundColor = '#e9ecef';
                });

                const fileIcon = document.createElement('i');
                fileIcon.className = `fas ${getFileIcon(attachment.fileName)}`;
                fileIcon.style.marginRight = '5px';

                const fileName = document.createElement('span');
                fileName.textContent = attachment.fileName;

                const fileSize = document.createElement('span');
                fileSize.textContent = ` (${formatFileSize(attachment.fileSize)})`;
                fileSize.style.marginLeft = '3px';
                fileSize.style.color = '#666';

                attachmentBtn.appendChild(fileIcon);
                attachmentBtn.appendChild(fileName);
                attachmentBtn.appendChild(fileSize);

              attachmentBtn.addEventListener('click', async () => {
                  try {
                      attachmentBtn.disabled = true;
                      attachmentBtn.style.opacity = '0.7';

                      const downloadIcon = document.createElement('i');
                      downloadIcon.className = 'fas fa-spinner fa-spin';
                      downloadIcon.style.marginRight = '5px';
                      attachmentBtn.insertBefore(downloadIcon, fileIcon);
                      fileIcon.remove();

                      const base64Data = await serverView.downloadAttachment(uid, attachment.fileName);

                      if (base64Data) {
                          const binaryData = atob(base64Data);
                          const bytes = new Uint8Array(binaryData.length);
                          for (let i = 0; i < binaryData.length; i++) {
                              bytes[i] = binaryData.charCodeAt(i);
                          }
                          const blob = new Blob([bytes], {type: 'application/octet-stream'});
                          const url = window.URL.createObjectURL(blob);

                          const tempLink = document.createElement('a');
                          tempLink.href = url;
                          tempLink.download = attachment.fileName;
                          document.body.appendChild(tempLink);
                          tempLink.click();

                          setTimeout(() => {
                              document.body.removeChild(tempLink);
                              window.URL.revokeObjectURL(url);
                          }, 100);
                      }
                  } catch (error) {
                      console.error('Download error:', error);
                      alert('Failed to download attachment: ' + error.message);
                  } finally {
                      attachmentBtn.disabled = false;
                      attachmentBtn.style.opacity = '1';
                      attachmentBtn.insertBefore(fileIcon, fileName);
                      if (attachmentBtn.querySelector('.fa-spinner')) {
                          attachmentBtn.removeChild(attachmentBtn.querySelector('.fa-spinner'));
                      }
                  }
              });

                attachmentsList.appendChild(attachmentBtn);
            });

            attachmentsDiv.appendChild(attachmentsTitle);
            attachmentsDiv.appendChild(attachmentsList);
            contentContainer.appendChild(attachmentsDiv);
        }

        // 10. Собираем все элементы вместе
        contentContainer.appendChild(header);
        contentContainer.appendChild(senderInfo);
        contentContainer.appendChild(document.createElement('hr'));
        contentContainer.appendChild(iframe);
        modal.appendChild(contentContainer);
        document.body.appendChild(modal);

       // 11. Загружаем контент в iframe после добавления в DOM
        setTimeout(() => {
            try {
                iframe.srcdoc = iframeContent;

                // Переменные для управления ResizeObserver
                let resizeObserver;
                let resizeTimeout;

                iframe.onload = () => {
                    try {
                        updateIframeSize(iframe);

                        // Создаем ResizeObserver с debounce
                        resizeObserver = new ResizeObserver((entries) => {
                            try {
                                clearTimeout(resizeTimeout);
                                resizeTimeout = setTimeout(() => {
                                    updateIframeSize(iframe);
                                }, 100); // Задержка 100мс
                            } catch (e) {
                                console.warn('ResizeObserver callback error:', e);
                            }
                        });

                        // Дополнительная проверка на полную загрузку контента
                        const checkReady = setInterval(() => {
                            if (iframe.contentDocument?.readyState === 'complete') {
                                clearInterval(checkReady);
                                try {
                                    if (iframe.contentDocument?.body) {
                                        resizeObserver.observe(iframe.contentDocument.body);
                                    }
                                } catch (e) {
                                    console.warn('ResizeObserver observe error:', e);
                                }
                            }
                        }, 100);

                    } catch (e) {
                        console.error('Iframe onload error:', e);
                    }
                };

                // Очистка при закрытии модального окна
                const cleanUp = () => {
                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }
                    if (resizeObserver) {
                        try {
                            resizeObserver.disconnect();
                        } catch (e) {
                            console.warn('ResizeObserver disconnect error:', e);
                        }
                    }
                    modal.removeEventListener('click', cleanUp);
                };

                closeButton.addEventListener('click', cleanUp);
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        cleanUp();
                    }
                });

            } catch (e) {
                console.error('Error loading iframe content:', e);
                iframe.srcdoc = '<html><body><p>Error loading email content</p></body></html>';
            }
        }, 0);

    } catch (error) {
        console.error('Error:', error);
        safeShowError('Failed to load email: ' + (error.message || 'Unknown error'));
    }
}

// 11. Загружаем контент в iframe после добавления в DOM   VARIANT BEFORE

function updateIframeSize(iframe) {
    try {
        if (!iframe || !iframe.contentWindow) return;

        const body = iframe.contentWindow.document.body;
        const html = iframe.contentWindow.document.documentElement;

        if (!body || !html) return;

        const height = Math.max(
            body.scrollHeight || 0,
            html.scrollHeight || 0,
            body.offsetHeight || 0,
            html.offsetHeight || 0
        );

        const maxHeight = window.innerHeight * 0.6;
        iframe.style.height = Math.min(height, maxHeight) + 'px';
        iframe.style.overflowY = height > maxHeight ? 'auto' : 'hidden';

    } catch (e) {
        console.warn('updateIframeSize error:', e);
    }
}

// Вспомогательная функция для форматирования размера файла

function formatFileSize(bytes) {
    if (bytes === 0 || bytes === undefined || bytes === null) {
        return 'Размер файла не известен, т.к. файл ещё не загружен в систему!';
    }
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: 'file-pdf',
        doc: 'file-word',
        docx: 'file-word',
        xls: 'file-excel',
        xlsx: 'file-excel',
        ppt: 'file-powerpoint',
        pptx: 'file-powerpoint',
        jpg: 'file-image',
        jpeg: 'file-image',
        png: 'file-image',
        gif: 'file-image',
        zip: 'file-archive',
        rar: 'file-archive',
        txt: 'file-alt',
        csv: 'file-csv'
    };
    return icons[ext] || 'file';
}

// Создаем модальное окно  для отправки email

function createEmailModal() {
    const modalHTML = `
    <div id="emailModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;">
        <div style="background:white;width:90%;max-width:800px;margin:20px auto;padding:20px;border-radius:5px;max-height:80vh;overflow-y:auto;">
            <h2>Новое письмо</h2>

            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;">Кому:</label>
                <input type="text" id="emailTo" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;"
                       placeholder="email@example.com">
            </div>

            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;">Тема:</label>
                <input type="text" id="emailSubject" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
            </div>

            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;">Сообщение:</label>
                <textarea id="emailBody" style="width:100%;height:150px;padding:8px;border:1px solid #ddd;border-radius:4px;"></textarea>
            </div>

            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;">Вложения:</label>
                <input type="file" id="emailAttachments" multiple style="width:100%;padding:8px;">
                <div id="attachmentsPreview" style="margin-top:10px;"></div>
            </div>

            <div style="margin-top: 5px;">
                <button id="clearAttachmentsBtn" style="padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; font-size: 12px;">
                    Очистить все вложения
                </button>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:20px;">
                <button id="sendEmailBtn" style="padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;">
                    Отправить
                </button>
                <button id="cancelEmailBtn" style="padding:8px 16px;background:#ddd;border:none;border-radius:4px;">
                    Отмена
                </button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupEmailModalHandlers();
}

// Объявляем переменную для хранения файлов на уровне модуля
let selectedFiles = [];

function setupEmailModalHandlers() {
    // Закрытие модального окна
    document.getElementById('cancelEmailBtn').addEventListener('click', () => {
        document.getElementById('emailModal').style.display = 'none';
    });

    // Обработка выбора файлов
    document.getElementById('emailAttachments').addEventListener('change', function(e) {
        const preview = document.getElementById('attachmentsPreview');
        const newFiles = Array.from(e.target.files || []);

        // Добавляем новые файлы, исключая дубликаты
        newFiles.forEach(newFile => {
            const isDuplicate = selectedFiles.some(
                existingFile => existingFile.name === newFile.name &&
                               existingFile.size === newFile.size
            );

            if (!isDuplicate) {
                selectedFiles.push(newFile);
            }
        });

        // Обновляем отображение
        updateAttachmentsPreview(preview);

        // Очищаем input, чтобы можно было добавить тот же файл снова
        e.target.value = '';
    });

    // Очистка всех вложений
    document.getElementById('clearAttachmentsBtn').addEventListener('click', function() {
        selectedFiles = [];
        document.getElementById('attachmentsPreview').innerHTML = '';
    });

    // Отправка письма
    document.getElementById('sendEmailBtn').addEventListener('click', function() {
        // Создаем DataTransfer с выбранными файлами
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => dataTransfer.items.add(file));

        // Устанавливаем файлы в input перед отправкой
        document.getElementById('emailAttachments').files = dataTransfer.files;

        // Вызываем оригинальную функцию отправки
        sendEmail();
    });
}

// Функция для отображения файлов как тегов
function updateAttachmentsPreview(previewContainer) {
    previewContainer.innerHTML = '';

    if (selectedFiles.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.style.display = 'flex';
        tagsContainer.style.flexWrap = 'wrap';
        tagsContainer.style.gap = '5px';
        tagsContainer.style.marginTop = '10px';

        selectedFiles.forEach((file, index) => {
            const tag = document.createElement('div');
            tag.style.display = 'flex';
            tag.style.alignItems = 'center';
            tag.style.padding = '4px 8px';
            tag.style.backgroundColor = '#e0e0e0';
            tag.style.borderRadius = '4px';
            tag.style.fontSize = '14px';

            const fileName = document.createElement('span');
            fileName.textContent = file.name;
            fileName.style.flexGrow = '1';
            fileName.style.overflow = 'hidden';
            fileName.style.textOverflow = 'ellipsis';
            fileName.style.whiteSpace = 'nowrap';
            fileName.style.maxWidth = '200px';

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.marginLeft = '5px';
            removeBtn.style.padding = '0 4px';
            removeBtn.style.background = 'transparent';
            removeBtn.style.color = '#666';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontWeight = 'bold';

            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedFiles.splice(index, 1);
                updateAttachmentsPreview(previewContainer);
            });

            tag.appendChild(fileName);
            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        });

        previewContainer.appendChild(tagsContainer);
    }
}

// Функция отправки письма с вложениями
async function sendEmail() {
    const to = document.getElementById('emailTo').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    const attachmentsInput = document.getElementById('emailAttachments');

    if (!to) {
        alert('Пожалуйста, укажите адрес получателя');
        return;
    }

    try {
        const attachments = [];

        // Обработка вложений, если они есть
        if (attachmentsInput.files && attachmentsInput.files.length > 0) {
            for (let i = 0; i < attachmentsInput.files.length; i++) {
                const file = attachmentsInput.files[i];
                const base64Content = await readFileAsBase64(file);
                attachments.push({
                    fileName: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    fileSize: file.size,
                    content: base64Content.split(',')[1] // Удаляем префикс data:*/*
                });
            }
        }

        const emailRequest = {
            clientEmail: to,
            subject: subject,
            body: body,
            attachments: attachments
        };

        const response = await fetch('http://localhost:8080/rest/entities/EmailRequest/send',  {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailRequest)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Письмо успешно отправлено');
            document.getElementById('emailModal').style.display = 'none';
            // Очищаем форму после успешной отправки
            document.getElementById('emailTo').value = '';
            document.getElementById('emailSubject').value = '';
            document.getElementById('emailBody').value = '';
            document.getElementById('emailAttachments').value = '';
            document.getElementById('attachmentsPreview').innerHTML = '';
        } else {
            throw new Error(result.message || 'Ошибка при отправке письма');
        }
    } catch (error) {
        console.error('Ошибка при отправке письма:', error);
        alert('Ошибка при отправке письма: ' + error.message);
    }
}

// Вспомогательная функция для чтения файла как base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Вспомогательная функция для конвертации файла в Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Функция показа уведомлений
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.background = type === 'error' ? '#ff4444' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1001';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function resetEmailForm() {
    document.getElementById('emailTo').value = '';
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailBody').value = '';
    document.getElementById('emailAttachments').value = '';
    document.getElementById('attachmentsPreview').innerHTML = '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Добавляем кнопку для открытия модального окна
function addEmailButton() {
    // Проверяем, не существует ли уже кнопка
    if (document.getElementById('newEmailBtn')) {
        return;
    }

    const btn = document.createElement('button');
    btn.id = 'newEmailBtn';
    btn.innerHTML = '<i class="fas fa-envelope"></i> Новое письмо';

    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #2ecc71;
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 999;
        transition: all 0.3s ease;
    `;

    // Добавляем hover-эффекты
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    });

    // Обработчик клика
    btn.addEventListener('click', () => {
        const modal = document.getElementById('emailModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('Модальное окно не найдено');
        }
    });

    document.body.appendChild(btn);
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';

    // Проверяем, является ли timestamp числом (может приходить как строка)
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;

    // Создаем объект Date
    const date = new Date(numericTimestamp);

    // Проверяем, что дата валидна
    if (isNaN(date.getTime())) return 'Invalid date';

    // Форматируем дату в удобочитаемый вид
    return date.toLocaleString(); // или используйте другой формат по вашему выбору
}

// Инициализация приложения
if (typeof initApp === 'undefined') {
function initApp() {
    if (!isEmailListViewPage()) {
            console.log('Not on email list view page, skipping app initialization');
            return;
        }

        // Сначала создаем модальное окно
        createEmailModal();

        // Затем инициализируем список писем
        initializeEmailListView(true);


    // Fallback инициализация
    const fallbackInit = () => {
        if (!emailListViewInitialized) {
            console.log('Fallback initialization');
            initializeEmailListView(true);
        }
    };

    // Несколько fallback-таймеров с разными интервалами
    setTimeout(fallbackInit, 500);
    setTimeout(fallbackInit, 2000);
    setTimeout(fallbackInit, 5000);
}
}


// Для Vaadin Flow
if (window.Vaadin && window.Vaadin.Flow) {
    window.Vaadin.Flow.initGlobal = function() {
        initApp();
    };
} else {
    // Стандартная инициализация
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initApp, 1);
    } else {
        document.addEventListener('DOMContentLoaded', initApp);
    }
}


// Улучшенный глобальный обработчик ошибок
window.addEventListener('error', function(event) {
    try {
        console.error('Global error:', event.error || event.message || 'Unknown error');

        if (errorMessage) {
            errorMessage.style.display = 'block';

            // Безопасное получение сообщения об ошибке
            const errorMsg = event.error?.message ||
                            event.message ||
                            event.type ||
                            'Неизвестная ошибка';

            errorMessage.textContent = `Ошибка: ${errorMsg}`;

            // Автоматическое скрытие сообщения через 5 секунд
            setTimeout(() => {
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
            }, 5000);
        }
    } catch (e) {
        console.error('Error in error handler:', e);
    }
});

// Добавляем обработчик для необработанных promise-ошибок
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled rejection:', event.reason);

    if (errorMessage) {
        errorMessage.style.display = 'block';

        const errorMsg = event.reason?.message ||
                        event.reason ||
                        'Неизвестная ошибка promise';

        errorMessage.textContent = `Promise ошибка: ${errorMsg}`;

        setTimeout(() => {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }, 5000);
    }
});

// Fallback инициализация
setTimeout(function() {
    console.log('Fallback initialization after timeout');
    initializeEmailListView();
}, 1000);

console.log('emailListView.js finished initial setup');