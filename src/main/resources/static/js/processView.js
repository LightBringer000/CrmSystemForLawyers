// Константы статусов
const STATUS_TEXT_MAP_IN_PROCESS = {
    'PLANNED': 'Запланировано',
    'IN_PROGRESS': 'В процессе',
    'COMPLETED': 'Завершено'
};

// Глобальные переменные состояния
let currentProcessId = null;
let processes = [];
let stages = [];
let processViewInitialized = false;
let initializationProcessesAttempts = 0;
let processModal = null;
const MAX_INIT_PROCESS_ATTEMPTS = 10;
const processObservers = [];
let vaadinCheckInterval;

// Константы API
const API_BASE_URL = 'http://localhost:8080/rest/entities';
const PROCESS_API = `${API_BASE_URL}/Process`;
const STAGES_API = `${API_BASE_URL}/CaseStage`;

// ================== Инициализация UI управления процессами ==================

function initProcessManagement() {
    const maxAttempts = 10;
    let attempts = 0;

    const tryInitialize = () => {
        attempts++;

        const containerSelectors = [
            '#processes-list',
            '#process-container',
            'vaadin-grid[aria-label="Processes"]'
        ];

        let processesContainer = null;
        for (const selector of containerSelectors) {
            processesContainer = document.querySelector(selector);
            if (processesContainer) break;
        }

        if (!processesContainer) {
            if (attempts < maxAttempts) {
                setTimeout(tryInitialize, 300);
                return;
            }
            console.error('Processes container not found after max attempts');
            return;
        }

        addProcessManagementUI();
    };

    tryInitialize();
}

function addProcessManagementUI() {
    // Проверяем, не добавлена ли уже основная кнопка
    if (document.querySelector('.add-process-btn:not(.empty-state)')) {
        return;
    }

    const containerSelectors = [
        '#process-container',
        '#process-view',
        '#processes-list',
        'vaadin-grid[aria-label="Processes"]'
    ];

    let container = null;
    for (const selector of containerSelectors) {
        container = document.querySelector(selector);
        if (container) break;
    }

    if (!container) {
        console.error('Process container not found');
        return;
    }

    // Ищем подходящее место для вставки кнопки
    const headerSelectors = [
        '.process-header h2',
        '.process-header',
        'h2',
        'h3',
        '.title',
        '.header'
    ];

    let insertAfterElement = null;
    for (const selector of headerSelectors) {
        insertAfterElement = container.querySelector(selector);
        if (insertAfterElement) break;
    }

    // Создаем кнопку
    const addProcessBtn = document.createElement('button');
    addProcessBtn.className = 'add-process-btn';
    addProcessBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить процесс';
    addProcessBtn.addEventListener('click', () => showProcessModal());

    // Вставляем кнопку в подходящее место
    if (insertAfterElement) {
        insertAfterElement.insertAdjacentElement('afterend', addProcessBtn);
    } else {
        container.prepend(addProcessBtn);
    }

    // Добавляем стили, если их еще нет
//    if (!document.querySelector('style[data-process-btn-styles]')) {
//        const style = document.createElement('style');
//        style.setAttribute('data-process-btn-styles', '');
//        style.textContent = `
//            .add-process-btn {
//                background-color: var(--lumo-primary-color);
//                color: white;
//                border: none;
//                padding: 8px 16px;
//                border-radius: 4px;
//                cursor: pointer;
//                margin: 16px 0;
//                display: inline-flex;
//                align-items: center;
//                gap: 8px;
//                font-size: 14px;
//                transition: background-color 0.2s;
//            }
//            .add-process-btn:hover {
//                background-color: var(--lumo-primary-color-50pct);
//            }
//            .add-process-btn.empty-state {
//                margin-top: 16px;
//                width: 100%;
//                justify-content: center;
//                padding: 12px 24px;
//            }
//            .add-process-btn i {
//                font-size: 14px;
//            }
//        `;
//        document.head.appendChild(style);
//    }
}


// ================== Основные функции инициализации ==================

function findProcessElements() {
    const elements = {
        processTabs: document.getElementById('process-tabs'),
        processesList: document.getElementById('processes-list') ||
                      document.querySelector('vaadin-grid[aria-label="Processes"]'),
        stagesContainer: document.getElementById('stages-container'),
        stagesList: document.getElementById('stages-list'),
        currentProcessName: document.getElementById('current-process-name'),
        noProcessesMessage: document.getElementById('no-processes-message'),
        noStagesMessage: document.getElementById('no-stages-message'),
        stageModal: document.getElementById('stage-modal'),
        stageForm: document.getElementById('stage-form'),
        modalTitle: document.getElementById('modal-title')
    };

    for (const [key, element] of Object.entries(elements)) {
        if (!element && key !== 'stageModal') {
            console.error(`Element not found: ${key}`);
            return null;
        }
    }

    return elements;
}

function setupEventHandlers(elements, currentProcessId) {
    const refreshBtn = document.getElementById('refresh-processes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadProcesses);
    }

    const saveOrderBtn = document.getElementById('save-stages-order');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveStagesOrder);
    }

    const addStageBtn = document.getElementById('add-stage-btn');
    if (addStageBtn) {
        // ИСПРАВЛЕНИЕ: Передаем ID процесса в showStageModal
        addStageBtn.addEventListener('click', () => showStageModal(currentProcessId));
    }

    const closeBtn = elements.stageModal?.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideStageModal);
    }

    if (elements.stageForm) {
        elements.stageForm.addEventListener('submit', handleStageFormSubmit);
    }
}

function setupProcessObservers(elements) {
    processObservers.forEach(observer => observer.disconnect());
    processObservers.length = 0;

    const mainObserver = new MutationObserver(() => {
        if (!document.getElementById('processes-list') &&
            !document.querySelector('vaadin-grid[aria-label="Processes"]')) {
            console.log('Main container changed, reinitializing...');
            processViewInitialized = false;
            initializeProcessView(true);
        }
    });

    mainObserver.observe(document.body, {childList: true, subtree: true});
    processObservers.push(mainObserver);
}





// Модифицированная версия вашей оригинальной функции
async function initializeProcessView() {
    try {
        console.log('Начало инициализации ProcessView');

        // 1. Проверяем наличие DOM-элементов
        const elements = findProcessElements();
        if (!elements) {
            throw new Error('Не найдены необходимые элементы интерфейса');
        }

        // 2. Инициализируем Vaadin API
        await checkVaadinInitialization();

        // 3. Проверяем наличие dealId
        if (!window.dealId) {
            // Пробуем получить dealId из URL
            const params = new URLSearchParams(window.location.search);
            window.dealId = params.get('dealId');

            if (!window.dealId) {
                throw new Error('ID дела не указан в URL');
            }
        }

        // 4. Загружаем процессы
        await loadProcesses();

        // 5. Настраиваем UI
        setupEventHandlers();
        initProcessManagement();

        console.log('ProcessView успешно инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации:', error);

        // Показываем пользовательский интерфейс ошибки
        document.getElementById('init-error').style.display = 'block';
        document.getElementById('retry-init').onclick = () => {
            location.reload();
        };
    }
}

// ================== Функции для работы с модальными окнами ==================

function showProcessModal(process = null) {
    console.group('showProcessModal');
    console.log('Начало выполнения функции showProcessModal');
    console.log('processModal до проверки:', processModal);
    console.log('process:', process);

    // Проверяем, существует ли модальное окно в DOM
    const existingModal = document.getElementById('process-modal');
    console.log('existingModal в DOM:', existingModal);

    // Если модальное окно уже существует в DOM, но processModal не установлен
    if (existingModal && !processModal) {
        console.log('Найдено существующее модальное окно в DOM, но processModal не установлен');
        processModal = existingModal;
        initModalHandlers();
        initProcessForm();
    }

    // Если модальное окно уже существует, просто обновляем его содержимое
    if (processModal) {
        console.log('Модальное окно уже существует, обновляем содержимое');
        updateModalContent(process);
        processModal.style.display = 'block';

        console.log('processModal после обновления:', processModal);
        console.groupEnd();
        return;
    }

    console.log('Создаем новое модальное окно');
    // Создаем новое модальное окно
    const modalHTML = `
        <div id="process-modal" class="modal">
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h3 id="process-modal-title">${process ? 'Редактирование' : 'Новый'} процесс</h3>
                <form id="process-form">
                    <input type="hidden" id="process-id" value="${process?.id || ''}">
                    <div class="form-group">
                        <label for="process-name">Название</label>
                        <input type="text" id="process-name" value="${escapeHtml(process?.processName || '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="process-description">Описание</label>
                        <textarea id="process-description">${escapeHtml(process?.processDescription || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="process-status">Статус</label>
                        <select id="process-status">
                            ${Object.entries(STATUS_TEXT_MAP_IN_PROCESS).map(([value, label]) => `
                                <option value="${value}" ${process?.status === value ? 'selected' : ''}>
                                    ${label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <button type="submit" class="save-btn">Сохранить</button>
                </form>
            </div>
        </div>
    `;

    console.log('Вставляем HTML модального окна в DOM');
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    processModal = document.getElementById('process-modal');
    console.log('processModal после создания:', processModal);

    // Инициализация обработчиков
    console.log('Инициализируем обработчики модального окна');
    initModalHandlers();
    initProcessForm();

    // Обновляем содержимое
    console.log('Обновляем содержимое модального окна');
    updateModalContent(process);

    // Показываем модальное окно
    console.log('Показываем модальное окно');
    processModal.style.display = 'block';

    // Фокусируемся на первом поле ввода
    setTimeout(() => {
        const firstInput = processModal.querySelector('input, textarea, select');
        if (firstInput) {
            console.log('Устанавливаем фокус на первый input:', firstInput);
            firstInput.focus();
        }
    }, 100);

    console.groupEnd();
}

function updateModalContent(process) {
    console.group('updateModalContent');
    if (!processModal) {
        console.log('processModal не существует, выход');
        console.groupEnd();
        return;
    }

    console.log('Обновляем заголовок модального окна');
    document.getElementById('process-modal-title').textContent =
        process ? 'Редактирование процесса' : 'Новый процесс';

    console.log('Обновляем ID процесса:', process?.id || '');
    document.getElementById('process-id').value = process?.id || '';

    console.log('Обновляем название процесса:', process?.processName || '');
    document.getElementById('process-name').value = process?.processName || '';

    console.log('Обновляем описание процесса:', process?.processDescription || '');
    document.getElementById('process-description').value = process?.processDescription || '';

    console.log('Обновляем статус процесса:', process?.status || 'PLANNED');
    document.getElementById('process-status').value = process?.status || 'PLANNED';

    console.groupEnd();
}

function initModalHandlers() {
    console.group('initModalHandlers');
        if (!processModal) {
            console.log('processModal не существует, выход');
            console.groupEnd();
            return;
        }

        // Обработчик закрытия по кнопке
        const closeBtn = processModal.querySelector('.close-btn');
        if (closeBtn) {
            console.log('Добавляем обработчик для кнопки закрытия');
            closeBtn.onclick = hideProcessModal;
        }

        // Обработчик для кнопки "Отмена"
        const cancelBtn = processModal.querySelector('.cancel-btn');
        if (cancelBtn) {
            console.log('Добавляем обработчик для кнопки "Отмена"');
            cancelBtn.onclick = hideProcessModal;
        }

    // Обработчик закрытия при клике вне модального окна
    console.log('Добавляем обработчик клика вне модального окна');
    processModal.addEventListener('click', (e) => {
        if (e.target === processModal) {
            console.log('Клик вне модального окна, закрываем');
            hideProcessModal();
        }
    });

    // Обработчик закрытия по Escape
    console.log('Добавляем обработчик клавиши Escape');
    document.addEventListener('keydown', handleEscape);

    console.groupEnd();
}

function hideProcessModal() {
    console.group('hideProcessModal');
    if (processModal) {
        console.log('Скрываем модальное окно');
        processModal.style.display = 'none';
    } else {
        console.log('processModal не существует, нечего скрывать');
    }
    console.groupEnd();
}

function handleEscape(e) {
    if (e.key === 'Escape' && processModal && processModal.style.display === 'block') {
        console.log('Нажата клавиша Escape, закрываем модальное окно');
        hideProcessModal();
    }
}

function showStageModal(stage = null) {
    const modal = document.getElementById('stage-modal');
        const form = document.getElementById('stage-form');
        const modalTitle = document.getElementById('modal-title');

        if (!modal || !form || !modalTitle) return;

    if (stage) {
        modalTitle.textContent = 'Редактирование стадии';
        document.getElementById('stage-id').value = stage.id || '';
        document.getElementById('stage-name').value = stage.stageName || '';
        document.getElementById('stage-description').value = stage.stageDescription || '';
        document.getElementById('stage-status').value = stage.status || 'PLANNED';
        document.getElementById('start-date').value = stage.startDate || '';
        document.getElementById('end-date').value = stage.endDate || '';
    } else {
        modalTitle.textContent = 'Новая стадия';
        form.reset();
        // Устанавливаем статус по умолчанию для новой стадии
        document.getElementById('stage-status').value = 'PLANNED';
    }

    const processIdInput = document.getElementById('process-id-input');
    if (processIdInput && currentProcessId) {
        processIdInput.value = currentProcessId;
    }

    const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.onclick = hideStageModal;
        }

    modal.style.display = 'block';
}

function hideStageModal() {
    const modal = document.getElementById('stage-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================== Вспомогательные функции ==================

function showError(message) {
    console.error('Error:', message);
    // Можно добавить отображение ошибки в UI
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
}

function showNotification(message) {
    console.log('Notification:', message);
    // Можно добавить красивый toast вместо alert
    alert(message); // Временная реализация
}

function showLoading(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="loading">${message}</div>`;
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function getStatusText(status) {
    return STATUS_TEXT_MAP_IN_PROCESS[status] || status;
}

function isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false;

    // Проверяем базовую структуру UUID (8-4-4-4-12)
    const parts = uuid.split('-');
    if (parts.length !== 5) return false;
    if (parts[0].length !== 8) return false;
    if (parts[1].length !== 4) return false;
    if (parts[2].length !== 4) return false;
    if (parts[3].length !== 4) return false;
    if (parts[4].length !== 12) return false;

    // Проверяем, что все символы - hex
    const hexRegex = /^[0-9a-f]+$/i;
    return parts.every(part => hexRegex.test(part));
}

function getDealIdFromUrl() {
    try {
        // Вариант 1: Из пути URL
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        let dealId = pathSegments[pathSegments.length - 1];

        // Вариант 2: Из query параметров
        if (!dealId || !isValidUUID(dealId)) {
            const params = new URLSearchParams(window.location.search);
            dealId = params.get('process-id');
        }

        // Вариант 3: Из глобальной переменной (если используется Vaadin)
        if ((!dealId || !isValidUUID(dealId)) && window.Vaadin?.Flow?.dealId) {
            dealId = window.Vaadin.Flow.dealId;
        }

        // Проверка результата
        if (!dealId) {
            console.error('Deal ID not found in URL or query params');
            showError('ID дела не найден');
            return null;
        }

        // Нормализация ID (удаление возможных лишних символов)
        dealId = dealId.trim().toLowerCase();

        if (!isValidUUID(dealId)) {
            console.error('Invalid deal ID format:', dealId);
            showError('Неверный формат ID дела');
            return null;
        }

        console.log('Using deal ID:', dealId);
        return dealId;
    } catch (error) {
        console.error('Error while extracting deal ID:', error);
        showError('Ошибка при получении ID дела');
        return null;
    }
}

// ================== Функции для работы с процессами ==================

async function createProcess(processData) {
    const url = processData.id
        ? `http://localhost:8080/rest/entities/Process/${processData.id}`
        : 'http://localhost:8080/rest/entities/Process';

    const method = processData.id ? 'PUT' : 'POST';

    const requestBody = {
        _entityName: "Process",
        ...processData
    };

    // Удаляем id из тела запроса, если он есть (для POST-запросов)
    if (!processData.id) {
        delete requestBody.id;
    }

    console.log('Отправка данных:', {url, method, body: requestBody});

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка сервера');
    }

    return await response.json();
}

async function updateProcess(processId, processData) {
    try {
        const response = await fetch(`${PROCESS_API}/${processId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(processData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating process:', error);
        showError('Ошибка обновления процесса');
        throw error;
    }
}

async function deleteProcess(processId) {
    try {
        const response = await fetch(`${PROCESS_API}/${processId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting process:', error);
        showError('Ошибка удаления процесса');
        return false;
    }
}

async function loadProcesses() {
    try {
        // Проверяем наличие dealId
        if (!window.dealId) {
            throw new Error('Deal ID not specified. Please ensure dealId is set before loading processes.');
        }

        console.log('Loading processes for dealId:', window.dealId);

        const requestBody = {
            filter: {
                conditions: [{
                    property: "deal.id",
                    operator: "=",
                    value: window.dealId
                }]
            },
            limit: 50,
            offset: 0
        };

        console.log('Sending request to:', `${PROCESS_API}/search`);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${PROCESS_API}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        processes = await response.json();
        console.log('Successfully loaded processes:', processes);
        renderProcesses();
    } catch (error) {
        console.error('Error loading processes:', error);
        showError('Ошибка загрузки процессов: ' + error.message);

        // Если проблема с dealId, покажем более информативное сообщение
        if (error.message.includes('Deal ID')) {
            showError('Не удалось загрузить процессы: ID дела не указан. Пожалуйста, перезагрузите страницу или проверьте URL.');
        }
    }
}

function renderProcesses() {
    const processesList = document.getElementById('processes-list');
    const noProcessesMessage = document.getElementById('no-processes-message');

    if (!processesList || !noProcessesMessage) return;

    // Удаляем все существующие кнопки добавления
    document.querySelectorAll('.add-process-btn').forEach(btn => btn.remove());

    if (!Array.isArray(processes)) {
        console.error('Processes is not an array:', processes);
        processes = [];
    }

    if (processes.length === 0) {
        noProcessesMessage.style.display = 'block';
        processesList.style.display = 'none';

        // Добавляем только одну кнопку
        const addBtn = document.createElement('button');
        addBtn.className = 'add-process-btn empty-state';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить первый процесс';
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showProcessModal();
        });
        noProcessesMessage.insertAdjacentElement('afterend', addBtn);
        return;
    }

    noProcessesMessage.style.display = 'none';
    processesList.style.display = 'block';
    processesList.innerHTML = '';

    processes.forEach(process => {
        const processElement = createProcessElement(process);
        processesList.appendChild(processElement);
    });

    // Добавляем основную кнопку после списка
    addProcessManagementUI();
}

function createProcessElement(process) {
    const element = document.createElement('div');
    element.className = 'process-item';
    element.dataset.processId = process.id;

    element.innerHTML = `
        <div class="process-info">
            <h4>${escapeHtml(process.processName) || 'Без названия'}</h4>
            <p>${escapeHtml(process.processDescription) || ''}</p>
            <div class="process-status ${(process.status || '').toLowerCase()}">
                ${getStatusText(process.status)}
            </div>
        </div>
        <div class="process-actions">
            <button class="view-stages-btn" data-process-id="${process.id}">
                <i class="fas fa-chevron-right"></i> Показать стадии
            </button>
            <button class="edit-process-btn" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-process-btn" title="Удалить">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Обработчики событий
    element.querySelector('.view-stages-btn').addEventListener('click', () => showProcessStages(process));
    element.querySelector('.edit-process-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showProcessModal(process);
    });
    element.querySelector('.delete-process-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteProcess(process.id);
    });

    return element;
}

function showProcessStages(process) {
    currentProcessId = process.id;
    const currentProcessName = document.getElementById('current-process-name');
    const processesList = document.getElementById('processes-list');
    const stagesContainer = document.getElementById('stages-container');

    if (currentProcessName) {
        currentProcessName.innerHTML = `
            <button id="back-to-processes" class="back-btn" title="Вернуться к списку процессов">
                <i class="fas fa-arrow-left"></i>
            </button>
            ${process.processName || 'Стадии процесса'}
        `;

        // Добавляем обработчик для кнопки "Назад"
        document.getElementById('back-to-processes').addEventListener('click', () => {
            stagesContainer.style.display = 'none';
            processesList.style.display = 'block';
            currentProcessId = null;
        });
    }

    if (processesList && stagesContainer) {
        processesList.style.display = 'none';
        stagesContainer.style.display = 'block';
    }

    loadStages(process.id);
}

// ================== Функции для работы со стадиями ==================

async function loadStages(processId) {
    try {
        showLoading('stages-list', 'Загрузка стадий...');

        const response = await fetch(`${STAGES_API}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filter: {
                    conditions: [{
                        property: "process.id",
                        operator: "=",
                        value: processId
                    }]
                },
                sort: "orderIndex,asc"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        stages = Array.isArray(result) ? result : [];
        renderStages();
    } catch (error) {
        console.error('Error loading stages:', error);
        showError('Ошибка загрузки стадий: ' + error.message);
    }
}

function renderStages() {
    const stagesList = document.getElementById('stages-list');
    const noStagesMessage = document.getElementById('no-stages-message');

    if (!stagesList || !noStagesMessage) return;

    if (stages.length === 0) {
        noStagesMessage.style.display = 'block';
        stagesList.style.display = 'none';
        return;
    }

    noStagesMessage.style.display = 'none';
    stagesList.style.display = 'block';
    stagesList.innerHTML = '';

    stages.forEach(stage => {
        const stageElement = createStageElement(stage);
        stagesList.appendChild(stageElement);
    });

    // Инициализируем сортировку после небольшой задержки
    setTimeout(() => initSortableStages(), 50);
}

function createStageElement(stage) {
    const element = document.createElement('div');
    element.className = 'stage-item';
    element.dataset.stageId = stage.id;
    element.draggable = true;

    // Форматируем даты
    const startDateFormatted = stage.startDate ? formatDate(stage.startDate) : 'не указано';
    const endDateFormatted = stage.endDate ? formatDate(stage.endDate) : 'не указано';

    // Определяем классы для статуса
    const statusClass = (stage.status || 'PLANNED').toLowerCase().replace('_', '-');
    const statusText = getStatusText(stage.status);

    // Порядковый номер (начиная с 1)
    const orderNumber = (stage.orderIndex || 0) + 1;

    element.innerHTML = `
        <div class="stage-info">
            <div class="stage-order-index" title="Порядковый номер">${orderNumber}</div>
            <div class="stage-handle" title="Перетащите для изменения порядка">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="stage-content">
                <div class="stage-header">
                    <h4 class="stage-title">${escapeHtml(stage.stageName || 'Без названия')}</h4>
                    <div class="stage-status-badge ${statusClass}">${statusText}</div>
                </div>
                ${stage.stageDescription ? `
                    <div class="stage-description">${escapeHtml(stage.stageDescription)}</div>
                ` : ''}
                <div class="stage-dates">
                    <div class="stage-date">
                        <span class="date-label">Начало:</span>
                        <span class="date-value">${startDateFormatted}</span>
                    </div>
                    <div class="stage-date">
                        <span class="date-label">Окончание:</span>
                        <span class="date-value">${endDateFormatted}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="stage-actions">
            <button class="stage-action-btn edit-stage-btn" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
            <button class="stage-action-btn delete-stage-btn" title="Удалить">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    // Обработчики событий
    element.querySelector('.edit-stage-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showStageModal(stage);
    });

    element.querySelector('.delete-stage-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Удалить стадию "${stage.stageName}"?`)) {
            deleteStage(stage.id);
        }
    });

    return element;
}


async function initializeStagesOrder(processId) {
    const response = await fetch(`${STAGES_API}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filter: { conditions: [{ property: "process.id", operator: "=", value: processId }] },
            sort: { orders: [{ property: "createdDate", direction: "ASC" }] }
        })
    });

    const stages = await response.json();
    const updates = stages.map((stage, index) =>
        fetch(`${STAGES_API}/${stage.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIndex: index })
        })
    );

    await Promise.all(updates);
    console.log('Order initialized for', updates.length, 'stages');
}

// ================== Drag and Drop для стадий ==================

function initSortableStages() {
    const stagesList = document.getElementById('stages-list');
    if (!stagesList) return;

    // Очищаем старые обработчики
    stagesList.removeEventListener('dragover', handleDragOver);
    stagesList.querySelectorAll('.stage-item').forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
    });

    // Добавляем новые обработчики
    stagesList.addEventListener('dragover', handleDragOver);
    stagesList.querySelectorAll('.stage-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.draggable = true;
    });
}

function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.stageId);
    e.target.classList.add('dragging');

    // Улучшение: добавляем небольшой delay для более плавного перетаскивания
    setTimeout(() => {
        e.target.style.opacity = '0.4';
    }, 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const draggingElement = document.querySelector('.dragging');
    if (!draggingElement) return;

    const afterElement = getDragAfterElement(e.currentTarget, e.clientY);
    if (afterElement) {
        e.currentTarget.insertBefore(draggingElement, afterElement);
    } else {
        e.currentTarget.appendChild(draggingElement);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.stage-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveStagesOrder() {
    try {
        const stagesList = document.getElementById('stages-list');
        if (!stagesList) return;

        const stageElements = stagesList.querySelectorAll('.stage-item');
        const updates = [];
        const batchSize = 5; // Размер батча для группировки запросов
        let currentBatch = [];

        for (let i = 0; i < stageElements.length; i++) {
            const stageId = stageElements[i].dataset.stageId;
            const stageToUpdate = stages.find(s => s.id === stageId);

            if (stageToUpdate) {
                const updatedStage = {
                    ...stageToUpdate,
                    orderIndex: i,
                    _entityName: "CaseStage"
                };

                currentBatch.push(
                    fetch(`${STAGES_API}/${stageId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(updatedStage)
                    })
                );

                // Отправляем батч при достижении размера
                if (currentBatch.length >= batchSize) {
                    updates.push(Promise.all(currentBatch));
                    currentBatch = [];
                }
            }
        }

        // Отправляем оставшиеся запросы
        if (currentBatch.length > 0) {
            updates.push(Promise.all(currentBatch));
        }

        await Promise.all(updates);
        showNotification('Порядок стадий успешно сохранен');

        // Опционально: перезагружаем стадии для синхронизации
        await loadStages(currentProcessId);
    } catch (error) {
        console.error('Error saving order:', error);
        showError('Ошибка сохранения порядка: ' + error.message);
    }
}

// ================== Обработчики форм ==================

async function handleProcessFormSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    const form = document.getElementById('process-form');
    if (!form) {
        console.error('Форма процесса не найдена');
        return;
    }

    const formData = new FormData(form);
    const processData = {
            processName: formData.get('process-name'),
            processDescription: formData.get('process-description'),
            status: formData.get('process-status'),
            startDate: formData.get('process-start-date') || null,
            endDate: formData.get('process-end-date') || null,
            priority: formData.get('process-priority') || 'MEDIUM'
        };

    const processId = formData.get('process-id');
    if (processId) {
        processData.id = processId;
    }

    const isEdit = !!processId;

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        }

        // Добавляем dealId только при создании нового процесса
        if (!isEdit) {
            processData.deal = { id: window.dealId };
        }

        if (!processData.processName) {
            throw new Error('Название процесса обязательно');
        }

        const savedProcess = await createProcess(processData);

        hideProcessModal();
        await loadProcesses();
        showNotification(isEdit ? 'Процесс обновлен' : 'Процесс создан');

    } catch (error) {
        console.error('Ошибка сохранения процесса:', error);
        showError(`Ошибка: ${error.message}`);
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить';
        }
    }
}

// Инициализация обработчиков формы
function initProcessForm() {
    const form = document.getElementById('process-form');
    if (!form) return;

    // Удаляем старые обработчики
    form.removeEventListener('submit', handleProcessFormSubmit);

    // Добавляем новый обработчик с preventDefault
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleProcessFormSubmit(e);
    });

    // Обработчик для кнопки на случай особого поведения Vaadin
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.onclick = (e) => {
            e.preventDefault();
            handleProcessFormSubmit(e);
        };
    }

    // Обработчик для кнопки "Отмена"
    const cancelBtn = form.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            hideProcessModal();
        };
    }
}

//Добавление стадий к процессам
async function handleStageFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    try {
        // Получаем данные из формы
        const stageId = form.querySelector('#stage-id')?.value;
        const processId = form.querySelector('#process-id-input')?.value;
        const stageName = form.querySelector('#stage-name')?.value;
        const stageDescription = form.querySelector('#stage-description')?.value;
        const status = form.elements['stage-status']?.value || 'PLANNED';
        const startDate = form.querySelector('#start-date')?.value || new Date().toISOString().slice(0, 10);
        const endDate = form.querySelector('#end-date')?.value || null;

        // Проверка обязательных полей
        if (!stageName) {
            throw new Error('Название стадии обязательно');
        }

        if (!processId) {
            throw new Error('Не указан процесс для стадии');
        }

        // Для новой стадии - определяем порядковый индекс
        let orderIndex;
        if (!stageId) {
            const response = await fetch(`${STAGES_API}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filter: {
                        conditions: [{
                            property: "process.id",
                            operator: "=",
                            value: processId
                        }]
                    },
                    limit: 0 // Только подсчет, без данных
                })
            });

            const total = (await response.json()).length;

            if (!response.ok) {
                throw new Error('Не удалось получить количество стадий');
            }

            const countData = await response.json();
            orderIndex = countData.count || 0;
        }

        // Формируем данные для отправки
        const requestData = {
            _entityName: "CaseStage",
            stageName: stageName,
            stageDescription: stageDescription,
            status: status,
            startDate: startDate,
            endDate: endDate,
            process: { id: processId }
        };

        // Добавляем orderIndex только для новых стадий
        if (orderIndex !== undefined) {
            requestData.orderIndex = orderIndex;
        }

        console.log('Sending stage data:', requestData);

        // Определяем метод и URL для запроса
        const method = stageId ? 'PUT' : 'POST';
        const url = stageId ? `${STAGES_API}/${stageId}` : STAGES_API;

        // Отправляем запрос
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Ошибка сервера: ${response.status}`);
        }

        // Закрываем модальное окно и обновляем список
        hideStageModal();
        await loadStages(currentProcessId);
        showNotification(stageId ? 'Стадия обновлена' : 'Стадия добавлена');
        await loadProcesses();

    } catch (error) {
        console.error('Error saving stage:', error);
        showError(`Ошибка сохранения стадии: ${error.message}`);
    }
}

async function handleDeleteProcess(processId) {
    if (confirm('Вы уверены, что хотите удалить этот процесс? Все связанные стадии также будут удалены.')) {
        const success = await deleteProcess(processId);
        if (success) {
            await loadProcesses();
        }
    }
}

async function deleteStage(stageId) {
    try {
        const response = await fetch(`${STAGES_API}/${stageId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await loadStages(currentProcessId);
        showNotification('Стадия удалена');
    } catch (error) {
        console.error('Error deleting stage:', error);
        showError('Ошибка удаления стадии');
    }
}

// ================== Модальные окна для стадий ==================




// ================== Основные функции инициализации ==================

function findProcessElements() {
    // Ищем элементы без привязки к Vaadin
    return {
        processesList: document.getElementById('processes-list'),
        stagesContainer: document.getElementById('stages-container'),
        stagesList: document.getElementById('stages-list'),
        currentProcessName: document.getElementById('current-process-name'),
        noProcessesMessage: document.getElementById('no-processes-message'),
        noStagesMessage: document.getElementById('no-stages-message'),
        stageModal: document.getElementById('stage-modal'),
        stageForm: document.getElementById('stage-form'),
        modalTitle: document.getElementById('modal-title')
    };
}

function setupEventHandlers(elements) {

    if (!elements) return;

         const refreshBtn = document.getElementById('refresh-processes');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    if (currentProcessId) {
                        loadStages(currentProcessId);
                    } else {
                        loadProcesses();
                    }
                });
            }

    const saveOrderBtn = document.getElementById('save-stages-order');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveStagesOrder);
    }

    const addStageBtn = document.getElementById('add-stage-btn');
    if (addStageBtn) {
        addStageBtn.addEventListener('click', () => showStageModal());
    }

    const closeBtn = elements.stageModal?.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideStageModal);
    }

    if (elements.stageForm) {
        elements.stageForm.addEventListener('submit', handleStageFormSubmit);
    }
}

function setupProcessObservers() {
    const mainObserver = new MutationObserver(mutations => {
        const processViewExists = document.querySelector('[id="ProcessView"]');
        const keyElementsExist =
            document.getElementById('processes-list') ||
            document.querySelector('vaadin-grid[aria-label="Processes"]');

        if (!processViewExists) {
            console.log('ProcessView removed from DOM');
            processViewInitialized = false;
            return;
        }

        if (keyElementsExist && !processViewInitialized) {
            console.log('Key elements found, initializing...');
            initializeProcessView(true);
        }
    });

    mainObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    processObservers.push(mainObserver);
}

// Интеграция с Vaadin Flow
function setupVaadinIntegration() {
    if (!window.Vaadin?.Flow) return;

    // Обработчик готовности Vaadin
    if (window.Vaadin.Flow.ready) {
        window.Vaadin.Flow.ready.then(() => {
            console.log('Vaadin Flow ready, initializing ProcessView');
            initializeProcessView();
        });
    }

    // Обработчик обновлений UI
    if (window.Vaadin.Flow.clients?.ROOT?.onUiUpdate) {
        window.Vaadin.Flow.clients.ROOT.onUiUpdate(() => {
            if (!processViewInitialized) {
                console.log('Vaadin UI updated, reinitializing');
                initializeProcessView(true);
            }
        });
    }
}

// Обработчик навигации
function setupNavigationHandler() {
    window.addEventListener('popstate', () => {
        console.log('Navigation detected, reinitializing...');
        setTimeout(() => initializeProcessView(true), 300);
    });

    // Для Vaadin Router
    if (window.Vaadin?.router) {
        window.Vaadin.router.on('vaadin-router-location-changed', () => {
            setTimeout(() => initializeProcessView(true), 300);
        });
    }
}

// Инициализация при загрузке
function init() {
    // Очистка при уходе
    window.addEventListener('beforeunload', () => {
        processObservers.forEach(o => o.disconnect());
        clearInterval(vaadinCheckInterval);
        processViewInitialized = false;
    });

    // Проверка Vaadin каждые 2 секунды
    vaadinCheckInterval = setInterval(() => {
        if (window.Vaadin?.Flow && !window.Vaadin.Flow.__processViewInit) {
            window.Vaadin.Flow.__processViewInit = true;
            setupVaadinIntegration();
        }
    }, 2000);

    // Проверяем наличие dealId перед инициализацией
    const checkDealId = () => {
        if (!window.dealId) {
            const params = new URLSearchParams(window.location.search);
            window.dealId = params.get('dealId') || params.get('deal-id');
        }

        if (window.dealId) {
            initializeProcessView();
        } else {
            console.warn('DealId not found, retrying in 1 second...');
            setTimeout(checkDealId, 1000);
        }
    };

    if (document.readyState === 'complete') {
        setTimeout(checkDealId, 0);
    } else {
        document.addEventListener('DOMContentLoaded', checkDealId);
    }

    setupNavigationHandler();
    setupProcessObservers();
}

// Запуск
init();

async function initializeProcessView(force = false) {
    if (processViewInitialized && !force) return;
    if (initializationProcessesAttempts >= MAX_INIT_PROCESS_ATTEMPTS) return;

    initializationProcessesAttempts++;
    console.log(`Initializing ProcessView (attempt ${initializationProcessesAttempts})`);

    try {
        // 1. Получаем dealId из различных источников
        if (!window.dealId) {
            // Пробуем получить из URL
            const params = new URLSearchParams(window.location.search);
            window.dealId = params.get('dealId') || params.get('deal-id');

            // Если не нашли в URL, пробуем получить из пути
            if (!window.dealId) {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                const possibleId = pathParts[pathParts.length - 1];
                if (isValidUUID(possibleId)) {
                    window.dealId = possibleId;
                }
            }

            // Если все еще не нашли, пробуем получить из Vaadin
            if (!window.dealId && window.Vaadin?.Flow?.dealId) {
                window.dealId = window.Vaadin.Flow.dealId;
            }

            if (!window.dealId) {
                throw new Error('Не удалось определить ID дела');
            }
        }

        // 2. Проверка необходимых элементов
        const elements = findProcessElements();
        if (!elements) {
            throw new Error('Required elements not found');
        }

        // 3. Загрузка данных
        await loadProcesses();

        // 4. Настройка UI
        setupEventHandlers(elements);
        initProcessManagement();

        // 5. Настройка наблюдателей
        setupProcessObservers(elements);

        processViewInitialized = true;
        initializationProcessesAttempts = 0;
        console.log('ProcessView initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        processViewInitialized = false;

        // Повторная попытка через 1 секунду
        if (initializationProcessesAttempts < MAX_INIT_PROCESS_ATTEMPTS) {
            setTimeout(() => initializeProcessView(true), 1000);
        }
    }
}


//=================== Добавление стилей ==================

//function ensureProcessViewStyles() {
//    if (!document.getElementById('process-view-styles')) {
//        const style = document.createElement('style');
//        style.id = 'process-view-styles';
//        style.textContent = `
//            .process-item {
//                border: 1px solid #ddd;
//                border-radius: 4px;
//                padding: 16px;
//                margin-bottom: 12px;
//                display: flex;
//                justify-content: space-between;
//                align-items: center;
//                background: white;
//                transition: box-shadow 0.2s;
//            }
//
//            .process-item:hover {
//                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
//            }
//
//            .process-info {
//                flex-grow: 1;
//            }
//
//            .process-actions {
//                display: flex;
//                gap: 8px;
//                margin-left: 16px;
//            }
//
//            .process-actions button {
//                background: none;
//                border: none;
//                cursor: pointer;
//                color: var(--lumo-secondary-text-color);
//                padding: 4px;
//                border-radius: 4px;
//            }
//
//            .process-actions button:hover {
//                background: var(--lumo-contrast-5pct);
//                color: var(--lumo-primary-text-color);
//            }
//
//            .no-data-message {
//                text-align: center;
//                padding: 24px;
//                color: var(--lumo-secondary-text-color);
//            }
//
//            .process-status {
//                display: inline-block;
//                padding: 2px 8px;
//                border-radius: 12px;
//                font-size: 12px;
//                margin-top: 8px;
//            }
//
//            .process-status.planned {
//                background-color: #e0e0e0;
//                color: #424242;
//            }
//
//            .process-status.in_progress {
//                background-color: #bbdefb;
//                color: #0d47a1;
//            }
//
//            .process-status.completed {
//                background-color: #c8e6c9;
//                color: #1b5e20;
//            }
//        `;
//        document.head.appendChild(style);
//    }
//}

// ================== Запуск приложения ==================

function initView() {
    // Добавляем обработчик beforeunload
    window.addEventListener('beforeunload', () => {
        clearInterval(vaadinCheckInterval);
        processObservers.forEach(observer => observer.disconnect());
        processObservers.length = 0;
        processViewInitialized = false;
        vaadinInitialized = false;
        vaadinReady = false;
    });

    if (!document.getElementById('processes-list') &&
            !document.querySelector('vaadin-grid[aria-label="Processes"]') &&
            !document.getElementById('stages-container')) {
            console.log('Не найдены основные элементы интерфейса, прекращаем инициализацию');
            return;
        }

    if (window.Vaadin?.Flow?.ready) {
        window.Vaadin.Flow.ready.then(() => {
            setTimeout(initializeProcessView, 300);
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeProcessView, 500);
        });
    }

    setTimeout(() => {
        if (!processViewInitialized) {
            initializeProcessView(true);
        }
    }, 2000);
}

// Запуск инициализации
if (document.readyState === 'complete') {
    setTimeout(initView, 0);
} else {
    document.addEventListener('DOMContentLoaded', initView);
}

// MutationObserver для ProcessDetailView
const processViewObserver = new MutationObserver((mutations) => {
    const processViewElement = document.querySelector('[id="ProcessDetailView"]');
    if (processViewElement && !processViewInitialized) {
        initializeProcessView(true);
    }
});

processViewObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Интеграция с Vaadin Flow
//if (window.Vaadin?.Flow?.clients?.ROOT) {
//    window.Vaadin.Flow.clients.ROOT.submitToServer = function(formData) {
//        handleProcessFormSubmit(new Event('submit'));
//        return false;
//    };
//}


