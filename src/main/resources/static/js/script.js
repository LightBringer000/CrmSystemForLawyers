// Объявляем в начале файла, до всех функций

const tasksCache = {
    set: function(userId, tasks) {
        sessionStorage.setItem(`kanban-${userId}`, JSON.stringify({
            data: tasks,
            timestamp: Date.now()
        }));
    },
    get: function(userId) {
        const cached = sessionStorage.getItem(`kanban-${userId}`);
        if (!cached) return null;
        const { data, timestamp } = JSON.parse(cached);
        // Автоочистка через 5 минут
        if (Date.now() - timestamp > 300000) {
            this.clear(userId);
            return null;
        }
        return data;
    },
    clear: function(userId) {
        sessionStorage.removeItem(`kanban-${userId}`);
    }
};


// Константы для маппинга значений на русский язык
const STATUS_TEXT_MAP = {
    'PLANNED': 'Запланировано',
    'IN_PROGRESS': 'В процессе',
    'UNDER_REVIEW': 'На проверке',
    'COMPLETED': 'Завершено'
};

const PRIORITY_TEXT_MAP = {
    'HIGH': 'Высокий',
    'MEDIUM': 'Средний',
    'LOW': 'Низкий'
};


// *placeholder tasks
let tasks = [];

function showCustomAlert(message) {
    console.log('CALL: showCustomAlert()');
    const customAlert = document.getElementById('customAlert');
    const customAlertMessage = document.getElementById('customAlertMessage');
    const customAlertClose = document.getElementById('customAlertClose');

    // Проверка на наличие элементов
    if (!customAlert || !customAlertMessage || !customAlertClose) {
        console.error('Один из элементов модального окна не найден!');
        return;
    }

    // Устанавливаем сообщение
    customAlertMessage.textContent = message;

    // Показываем модальное окно
    customAlert.style.display = 'flex';

    // Закрытие модального окна при нажатии на кнопку "OK"
    customAlertClose.addEventListener('click', () => {
        customAlert.style.display = 'none';
    });

    // Закрытие модального окна при клике вне его области
    customAlert.addEventListener('click', (event) => {
        if (event.target === customAlert) {
            customAlert.style.display = 'none';
        }
    });
}

function initSaveButton(attempt = 1) {
    console.log('CALL: initSaveButton()');
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY = 500;
    const saveBtn = document.getElementById('saveKanbanBtn');

    if (!saveBtn) {
        if (attempt <= MAX_ATTEMPTS) {
            setTimeout(() => initSaveButton(attempt + 1), RETRY_DELAY);
        }
        return;
    }

    // Удаляем старые обработчики
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newSaveBtn);

    newSaveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await saveKanbanBoard(newSaveBtn);
    });
}

async function saveKanbanBoard(saveBtn = null) {
    console.log('CALL: saveKanbanBoard()');
    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Сохранение...';
        }

        const userId = getCurrentUserId();
        const tasks = getCurrentTasks();

        if (tasks.length === 0) {
            const confirmSave = confirm("Вы хотите сохранить пустую доску?");
            if (!confirmSave) {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Сохранить';
                }
                return;
            }
        }

        await KanbanStorage.save(userId, tasks);
        showCustomAlert("Доска успешно сохранена!");
        tasksCache.set(userId, tasks);

    } catch (error) {
        console.error('Save failed:', error);
        showCustomAlert("Ошибка сохранения: " + (error.message || 'Неизвестная ошибка'));
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Сохранить';
        }
    }
}

function setupDragAndDrop() {
    // Удаление старых обработчиков
    document.querySelectorAll('.task').forEach(task => {
        task.removeEventListener('dragstart', handleDragstart);
        task.removeEventListener('dragend', handleDragend);
    });

    document.querySelectorAll('.tasks').forEach(container => {
        container.removeEventListener('dragover', handleDragover);
    });

    // Добавление новых обработчиков
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('dragstart', handleDragstart);
        task.addEventListener('dragend', handleDragend);
    });

    document.querySelectorAll('.tasks').forEach(container => {
        container.addEventListener('dragover', handleDragover);
    });
}

function initTaskPreview() {
    const fetchTasksBtn = document.getElementById('fetchTasksByUserId');

    if (fetchTasksBtn) {
        // Удаляем старый обработчик перед добавлением нового
        fetchTasksBtn.removeEventListener('click', showTaskPreview);
        fetchTasksBtn.addEventListener('click', showTaskPreview);
    } else {
        console.warn('Кнопка предпросмотра задач не найдена');
    }
}
// Функции для преобразования значений
function getStatusText(status) {
    return STATUS_TEXT_MAP[status] || status;
}

function getPriorityText(priority) {
    return PRIORITY_TEXT_MAP[priority] || priority;
}


const KanbanStorage = {
    // Подготовка задач для хранения (стрелочная функция сохраняет контекст)


    prepareTasksForStorage: (tasks) => {
        console.log('CALL: KanbanStorage.prepareTasksForStorage()');
        if (!tasks || !Array.isArray(tasks)) {
            console.error("Invalid tasks data:", tasks);
            return [];
        }

        return tasks.map(task => ({
            id: task.id || Date.now().toString(),
            title: task.taskTitle || 'Без названия',
            status: task.taskStatus,
            priority: task.taskPriority || 'MEDIUM',
            deadline: task.deadline || new Date().toISOString()
        }));
    },

    // Преобразование задач из хранимого формата
    prepareTasksFromStorage: (storedTasks) => {
        console.log('CALL: KanbanStorage.prepareTasksFromStorage()');
        if (!storedTasks || !Array.isArray(storedTasks)) {
            console.error("Invalid stored tasks data:", storedTasks);
            return [];
        }

        return storedTasks.map(task => ({
            id: task.id,
            taskTitle: task.title || 'Без названия',
            taskStatus: task.status || 'PLANNED',
            taskPriority: task.priority || 'MEDIUM',
            deadline: task.deadline || new Date().toISOString()
        }));
    },

    // Форматирование даты
    formatDateForJmix: (date) => {
        console.log('CALL: KanbanStorage.formatDateForJmix()');
        const pad = num => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T` +
               `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000`;
    },

    // Подготовка данных состояния
    prepareStateData: function(userId, tasks) {
        console.log('CALL: KanbanStorage.prepareStateData()');
        return {
            _entityName: "KanbanState",
            userId: userId,
            stateJson: JSON.stringify(KanbanStorage.prepareTasksForStorage(tasks)),
            lastUpdated: KanbanStorage.formatDateForJmix(new Date())
        };
    },

    // Создание состояния
    createState: async function(userId, tasks) {
        console.log('CALL: KanbanStorage.createState()');
        try {
            const stateData = KanbanStorage.prepareStateData(userId, tasks);
            const response = await fetch('http://localhost:8080/rest/entities/KanbanState', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(stateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Create state failed:', error);
            throw error;
        }
    },

    // Загрузка состояния
    load: async function(userId) {
        console.log('CALL: KanbanStorage.load()');
        try {
            console.log('Loading state for user:', userId);

            // 1. Проверяем кэш
            const cached = tasksCache.get(userId);
            if (cached) {
                console.log('Returning cached tasks');
                return cached;
            }

            // 2. Загружаем из базы
            const state = await this.findExistingState(userId);
            console.log('State from DB:', state);

            if (state && state.stateJson) {
                const parsedTasks = JSON.parse(state.stateJson);
                const tasks = this.prepareTasksFromStorage(parsedTasks);

                // Сохраняем в кэш
                tasksCache.set(userId, tasks);
                console.log('Tasks loaded from DB:', tasks);

                return tasks;
            }

            console.log('No saved state found');
            return null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    },

    // Поиск существующего состояния
    findExistingState: async function(userId) {
        console.log('CALL: KanbanStorage.findExistingState()');
        try {
            const response = await fetch('http://localhost:8080/rest/entities/KanbanState/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    filter: {
                        conditions: [{
                            property: "userId",
                            operator: "=",
                            value: userId
                        }]
                    },
                    limit: 100,
                    sort: "lastUpdated,desc"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Raw DB response:', result);

            // Обработка разных форматов ответа
            if (Array.isArray(result)) {
                return result.length > 0 ? result[0] : null;
            }
            return result || null;
        } catch (error) {
            console.error('Find state error:', error);
            return null;
        }
    },

    // Сохранение состояния
    save: async function(userId, tasks) {
        console.log('CALL: KanbanStorage.save()');
        try {
            if (!tasks || tasks.length === 0) {
                console.log("Нет задач для сохранения");
                return Promise.resolve();
            }

            // 1. Попытка найти существующее состояние
            const existingState = await this.findExistingState(userId);

            if (existingState) {
                // 2. Если состояние существует, обновляем его
                await this.updateState(existingState.id, userId, tasks);
            } else {
                // 3. Если состояние не существует, создаем новое
                await this.createState(userId, tasks);
            }

        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            throw error;
        }
    },

    // Обновление существующего состояния
    updateState: async function(stateId, userId, tasks) {
        console.log('CALL: KanbanStorage.updateState()');
        try {
            const stateData = KanbanStorage.prepareStateData(userId, tasks);
            const response = await fetch(`http://localhost:8080/rest/entities/KanbanState/${stateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(stateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Update state failed:', error);
            throw error;
        }
    }
};

// Функция получения текущих задач из DOM
function getCurrentTasks() {
    const tasks = [];
    document.querySelectorAll('.column').forEach(column => {
        const status = column.dataset.status;
        column.querySelectorAll('.task').forEach(taskEl => {
            tasks.push({
                id: taskEl.dataset.id,
                taskTitle: taskEl.querySelector('.task-title')?.textContent || 'Без названия', // Добавлено извлечение названия
                taskStatus: status,
                taskPriority: taskEl.dataset.priority || 'MEDIUM',
                deadline: taskEl.dataset.deadline || new Date().toISOString()
            });
        });
    });
    return tasks;
}
async function loadWithConflictResolution(userId) {
    console.log('CALL: loadWithConflictResolution()');
    const [serverState, localState] = await Promise.all([
        loadFromServer(userId),
        loadFromLocal(userId)
    ]);

    // Простая стратегия - приоритет у более новой версии
    if (!serverState) return localState;
    if (!localState) return serverState;

    return serverState.lastUpdated > localState.lastUpdated ? serverState : localState;
}

// 1. Добавим глобальный флаг и обработчик маршрутизации
let kanbanInitialized = false;

// 2. Модифицируем функцию initKanban
async function initKanban(force = false) {
    if (kanbanInitialized && !force) return;
    kanbanInitialized = true;

    console.log('Initializing Kanban...');

    try {
        const userId = getCurrentUserId();

        // 1. Инициализация заголовков колонок
     document.querySelectorAll('.column').forEach(column => {
                const statusKey = column.dataset.status;
                const titleElement = column.querySelector('h3');

                if (!statusKey || !STATUS_TEXT_MAP[statusKey]) {
                    console.error(`Invalid column status: ${statusKey}`);
                    return;
                }

                titleElement.textContent = STATUS_TEXT_MAP[statusKey];


            // Обновление счетчика задач
            const taskCount = column.querySelectorAll('.task').length;
            const counterElement = column.querySelector('.task-count');
            if(counterElement) {
                counterElement.textContent = `(${taskCount})`;
            }
        });

        // 2. Очистка предыдущего состояния
        document.querySelectorAll('.column .tasks').forEach(container => {
            container.innerHTML = '';
        });

        // 3. Загрузка данных с игнорированием кэша
        tasksCache.clear(userId);
        const savedState = await KanbanStorage.load(userId);
        console.log('Loaded state:', savedState);

        // 4. Валидация и рендеринг задач
        if (savedState?.length > 0) {
            const validatedTasks = savedState.filter(task =>
                task.taskStatus && STATUS_TEXT_MAP[task.taskStatus]
            );
            renderTasks(validatedTasks);
        } else {
            renderTasks([]);
        }


        function initAddButtons() {
            document.querySelectorAll('button[data-add]').forEach(button => {
                // Удаляем старый обработчик перед добавлением нового
                button.removeEventListener('click', handleAdd);
                button.addEventListener('click', handleAdd);
            });
        }

        // 5. Инициализация взаимодействий
        initSaveButton();
        setupDragAndDrop();
        initTaskPreview();
        initAddButtons();

        // 6. Принудительное обновление интерфейса
        setTimeout(() => {
            document.querySelectorAll('.column').forEach(column => {
                const tasks = column.querySelectorAll('.task').length;
                console.log(`Column ${column.dataset.status} has ${tasks} tasks`);
            });
        }, 100);

    } catch (error) {
        console.error('Kanban init failed:', error);
        showCustomAlert(`Ошибка инициализации доски: ${error.message}`);
        // Fallback к пустому состоянию
        renderTasks([]);
    } finally {
        // 7. Гарантированное обновление счетчиков
        document.querySelectorAll('.column').forEach(column => {
            const taskCount = column.querySelectorAll('.task').length;
            const counterElement = column.querySelector('.task-count');
            if(counterElement) {
                counterElement.textContent = `(${taskCount})`;
            }
        });
    }
}




function prepareKanbanData(tasks) {
    console.log('CALL: prepareKanbanData()');
    return tasks.map(task => ({
        id: task.id,
        title: task.taskTitle,
        status: task.taskStatus,
        priority: task.taskPriority,
        deadline: task.deadline,
    }));
}

async function safeLoadKanbanState(userId) {
    console.log('CALL: safeLoadKanbanState()');
    try {
        const state = await loadKanbanState(userId);
        if (!state) throw new Error('Состояние не найдено');
        return state;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showCustomAlert('Не удалось загрузить сохраненное состояние');
        return null;
    }
}

// При сохранении
async function handleSave() {
    console.log('CALL: handleSave()');
    const userId = getCurrentUserId();
    const tasks = getCurrentTasks();
    KanbanStorage.save(userId, tasks);
}

const createTaskOnBackend = async (task) => {
    console.log('CALL: createTaskOnBackend()');
    try {
        const userId = getCurrentUserId();

        // Формируем объект задачи для отправки
        const taskToSend = {
            _entityName: "Task_",
            taskTitle: task.taskTitle,
            taskPriority: task.taskPriority || 'MEDIUM',
            taskStatus: task.taskStatus || 'PLANNED',
            deadline: task.deadline || new Date().toISOString(),
            responsibleLawyers: [
                {
                    _entityName: "User", // Указываем тип связанной сущности
                    id: userId           // ID пользователя
                }
            ]
        };

        console.log('Отправляемые данные:', taskToSend);

        const response = await fetch('http://localhost:8080/rest/entities/Task_', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(taskToSend),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка при создании задачи: ${response.status} - ${errorText}`);
        }

        const createdTask = await response.json();
        console.log('Созданная задача (ответ сервера):', createdTask);

        // Возвращаем задачу в стандартизированном формате
        return {
            id: createdTask.id,
            taskTitle: createdTask.taskTitle || task.taskTitle,
            taskPriority: createdTask.taskPriority || task.taskPriority,
            taskStatus: createdTask.taskStatus || task.taskStatus,
            deadline: createdTask.deadline || task.deadline,
            responsibleLawyers: [{ id: userId }] // Сохраняем информацию о связанных пользователях
        };

    } catch (error) {
        console.error('Ошибка при создании задачи:', error);
        showCustomAlert('Не удалось создать задачу: ' + (error.message || 'Неизвестная ошибка'));
        return null;
    } finally {
        const userId = getCurrentUserId();
        tasksCache.clear(userId);
    }
};

// получение задачи по id
const fetchTaskDetails = async (taskId) => {
    console.log('CALL: fetchTaskDetails()');
    try {
        const response = await fetch(`http://localhost:8080/rest/entities/Task_/${taskId}`);
        if (!response.ok) {
            throw new Error('Ошибка при получении данных задачи');
        }
        const task = await response.json();

        return {
            id: task.id,
            taskTitle: task.taskTitle || task.title,
            taskPriority: task.taskPriority || task.priority,
            taskStatus: task.taskStatus || task.status,
            deadline: task.deadline || new Date().toISOString()
        };
    } catch (error) {
        console.error('Ошибка:', error);
        showCustomAlert('Не удалось получить данные задачи: ' + error.message);
        return null;
    }
};

// Функция для получения задач с бэкенда
//const fetchTasks = async () => {
//    console.log('CALL: fetchTasks()');
//    try {
//        const response = await fetch('http://localhost:8080/api/tasks');
//        if (!response.ok) {
//            throw new Error('Ошибка при загрузке задач');
//        }
//        return await response.json();
//    } catch (error) {
//        console.error('Ошибка:', error);
//        showCustomAlert('Не удалось загрузить задачи: ' + error.message);
//    }
//};

// Функция для обновления задачи на бэкенде
const updateTaskOnBackend = async (id, task) => {
    console.log('CALL: updateTaskOnBackend()');
    try {
        const response = await fetch(`http://localhost:8080/rest/entities/Task_/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.message || 'Ошибка при обновлении задачи';
            throw new Error(errorMessage);
        }

        const updatedTask = await fetchTaskDetails(id);
        if (!updatedTask) {
            throw new Error('Не удалось получить обновлённые данные задачи');
        }

        return updatedTask;
    } catch (error) {
        console.error('Ошибка:', error);
        showCustomAlert('Не удалось обновить задачу: ' + error.message);
        throw error;
    }
};

const deleteTaskOnFromKanbanState = async (id) => {
    console.log('CALL: deleteTaskOnFromKanbanState()');
    try {
        const response = await fetch(`http://localhost:8080/rest/entities/KanbanState/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении задачи');
        }
        const userId = getCurrentUserId();
        tasksCache.clear(userId);
        return true; // Успешное удаление
    } catch (error) {
        console.error('Ошибка:', error);
        showCustomAlert('Не удалось удалить задачу: ' + error.message);
        return false; // Ошибка при удалении
    }
};

// Функция очистки кэша
const clearTasksCache = (userId) => {
    console.log('CALL: clearTasksCache()');
    delete tasksCache[userId];
};

async function fetchTasksByUserId(userId, previewMode = false) {
    console.log('CALL: fetchTasksByUserId()');
    try {
        const response = await fetch(`http://localhost:8080/rest/entities/Task_/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filter: {
                    conditions: [{
                        property: "responsibleLawyers.id",
                        operator: "=",
                        value: userId
                    }]
                },
                limit: 50,
                offset: 0
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error('Ошибка при получении задач:', error);
        showCustomAlert('Не удалось загрузить задачи');
        return [];
    }
}

async function showTaskPreview() {
    console.log('CALL: showTaskPreview()');
    try {
        const userId = getCurrentUserId();
        const tasks = await fetchTasksByUserId(userId, true);

        const modal = document.getElementById('taskPreviewModal');
        const modalContent = modal.querySelector('.modal-content');
        const taskList = document.getElementById('taskPreviewList');
        taskList.innerHTML = '';

        modal.style.top = '20px';
        modal.style.left = '50%';
        modal.style.transform = 'translateX(-50%)';

        let searchBox = document.getElementById('taskSearch');
        if (!searchBox) {
            searchBox = document.createElement('input');
            searchBox.type = 'text';
            searchBox.id = 'taskSearch';
            searchBox.placeholder = 'Поиск задач...';
            searchBox.className = 'task-search-input';
            modalContent.insertBefore(searchBox, modalContent.children[2]);
        } else {
            searchBox.value = '';
        }

        let scrollUpBtn = document.getElementById('scrollUpBtn');
        if (!scrollUpBtn) {
            scrollUpBtn = document.createElement('button');
            scrollUpBtn.id = 'scrollUpBtn';
            scrollUpBtn.className = 'scroll-btn';
            scrollUpBtn.textContent = '↑';
            modalContent.appendChild(scrollUpBtn);
        }

        let scrollDownBtn = document.getElementById('scrollDownBtn');
        if (!scrollDownBtn) {
            scrollDownBtn = document.createElement('button');
            scrollDownBtn.id = 'scrollDownBtn';
            scrollDownBtn.className = 'scroll-btn';
            scrollDownBtn.textContent = '↓';
            modalContent.appendChild(scrollDownBtn);
        }

        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="no-tasks-message">Нет доступных задач</p>';
        } else {
            tasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-preview-item';
                taskItem.dataset.taskId = task.id;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = task.id;
                checkbox.id = `task-${task.id}`;
                checkbox.className = 'task-checkbox';

                const label = document.createElement('label');
                label.htmlFor = `task-${task.id}`;
                label.className = 'task-label';
                label.innerHTML = `
                    <strong class="task-title">${task.taskTitle}</strong><br>
                    <span class="task-meta">Приоритет: ${getPriorityText(task.taskPriority)}</span><br>
                    <span class="task-meta">Статус: ${getStatusText(task.taskStatus)}</span><br>
                    <span class="task-meta">Дедлайн: ${new Date(task.deadline).toLocaleString()}</span>
                `;

                taskItem.appendChild(checkbox);
                taskItem.appendChild(label);
                taskList.appendChild(taskItem);
            });
        }

        const searchHandler = function(e) {
            const searchText = e.target.value.toLowerCase();
            const taskItems = document.querySelectorAll('.task-preview-item');
            taskItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchText) ? 'flex' : 'none';
            });
        };

        let scrollInterval;
        const scrollStep = 50;
        const scrollDelay = 100;

        const startScrollUp = () => {
            scrollInterval = setInterval(() => {
                taskList.scrollBy({ top: -scrollStep, behavior: 'smooth' });
            }, scrollDelay);
        };

        const startScrollDown = () => {
            scrollInterval = setInterval(() => {
                taskList.scrollBy({ top: scrollStep, behavior: 'smooth' });
            }, scrollDelay);
        };

        const stopScroll = () => {
            clearInterval(scrollInterval);
        };

        if (scrollUpBtn) {
            scrollUpBtn.addEventListener('mousedown', startScrollUp);
            scrollUpBtn.addEventListener('mouseup', stopScroll);
            scrollUpBtn.addEventListener('mouseleave', stopScroll);
        }

        if (scrollDownBtn) {
            scrollDownBtn.addEventListener('mousedown', startScrollDown);
            scrollDownBtn.addEventListener('mouseup', stopScroll);
            scrollDownBtn.addEventListener('mouseleave', stopScroll);
        }

        const closeModal = () => {
            modal.style.display = 'none';
            if (searchBox) searchBox.value = '';
            if (searchBox && searchBox.removeEventListener) searchBox.removeEventListener('input', searchHandler);
            if (scrollUpBtn && scrollUpBtn.removeEventListener) {
                scrollUpBtn.removeEventListener('mousedown', startScrollUp);
                scrollUpBtn.removeEventListener('mouseup', stopScroll);
                scrollUpBtn.removeEventListener('mouseleave', stopScroll);
            }
            if (scrollDownBtn && scrollDownBtn.removeEventListener) {
                scrollDownBtn.removeEventListener('mousedown', startScrollDown);
                scrollDownBtn.removeEventListener('mouseup', stopScroll);
                scrollDownBtn.removeEventListener('mouseleave', stopScroll);
            }
            if (document.querySelector('.close')) document.querySelector('.close').removeEventListener('click', closeButtonHandler);
            if (document.getElementById('confirmTaskSelection')) document.getElementById('confirmTaskSelection').removeEventListener('click', confirmSelectionHandler);
            if (document.getElementById('exitTaskPreview')) document.getElementById('exitTaskPreview').removeEventListener('click', exitPreviewHandler);
            modal.removeEventListener('click', outsideClickHandler);
            document.removeEventListener('keydown', escapeKeyHandler);

            if (scrollUpBtn && scrollUpBtn.parentNode) {
                scrollUpBtn.remove();
            }
            if (scrollDownBtn && scrollDownBtn.parentNode) {
                scrollDownBtn.remove();
            }
        };

        if (searchBox) searchBox.addEventListener('input', searchHandler);

        const closeButtonHandler = closeModal;

        const confirmSelectionHandler = () => {
            const selectedTasks = [];
            document.querySelectorAll('#taskPreviewList input:checked').forEach(checkbox => {
                const taskId = checkbox.value;
                const task = tasks.find(t => t.id === taskId);
                if (task) selectedTasks.push(task);
            });

            if (selectedTasks.length > 0) {
                renderTasks(selectedTasks, true);
                const userId = getCurrentUserId();
                const cachedTasks = tasksCache.get(userId) || [];
                tasksCache.set(userId, [...cachedTasks, ...selectedTasks]);
                closeModal();
            } else {
                showCustomAlert('Выберите хотя бы одну задачу');
            }
        };

        const exitPreviewHandler = closeModal;

        const outsideClickHandler = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };

        const escapeKeyHandler = (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        };

        document.querySelector('.close').onclick = closeButtonHandler;
        document.getElementById('confirmTaskSelection').onclick = confirmSelectionHandler;
        document.getElementById('exitTaskPreview').onclick = exitPreviewHandler;
        modal.addEventListener('click', outsideClickHandler);
        document.addEventListener('keydown', escapeKeyHandler);

        modal.style.display = 'block';

        setTimeout(() => {
            taskList.scrollTop = 0;
        }, 100);

    } catch (error) {
        console.error('Ошибка при показе предпросмотра задач:', error);
        showCustomAlert('Ошибка при загрузке задач: ' + error.message);
    }
}

function getCurrentUserId() {
    console.log('CALL: getCurrentUserId()');
    if (window.userData && window.userData.userId) {
        console.log('User ID from window.userData:', window.userData.userId);
        return window.userData.userId;
    }

    const sessionUserId = sessionStorage.getItem('userId');
    if (sessionUserId) {
        console.log('User ID from sessionStorage:', sessionUserId);
        return sessionUserId;
    }

    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const parsed = JSON.parse(userData);
            console.log('User ID from localStorage:', parsed.id);
            return parsed.id;
        } catch (e) {
            console.error('Ошибка парсинга userData:', e);
        }
    }

    console.error('User ID not available in any storage');
    throw new Error('User ID not available');
}

document.addEventListener('DOMContentLoaded', async () => {

    // Очистка кэша при первой загрузке
    const userId = getCurrentUserId();
    tasksCache.clear(userId);

     // Инициализация модального окна для документов
        createDocumentsModal();

    // Инициализация только если мы на нужной странице
    if (window.location.pathname.includes('kanban-view')) {
        await initKanban(true);
    }

    console.log('CALL: DOMContentLoaded event handler');
    try {
        console.log('DOM fully loaded and parsed');

        let userId;
        try {
            userId = getCurrentUserId();
            if (!userId) {
                console.warn('User not authenticated');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return;
            }
        } catch (authError) {
            console.error('Authentication check failed:', authError);
            showCustomAlert('Ошибка проверки авторизации');
            return;
        }

        try {
            window.kanban = new KanbanManager(userId);
            console.log('Kanban manager initialized');
        } catch (kanbanError) {
            console.error('Kanban initialization failed:', kanbanError);
            showCustomAlert('Ошибка инициализации доски');
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                try {
                    const response = await fetch('http://localhost:8080/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: loginForm.username.value,
                            password: loginForm.password.value,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Ошибка при входе');
                    }

                    const data = await response.json();
                    if (data.username && data.id) {
                        sessionStorage.setItem('userId', data.id);
                        showCustomAlert(`Добро пожаловать, ${data.username}!`);
                        window.location.href = '/main';
                    } else {
                        throw new Error('Неполные данные пользователя');
                    }
                } catch (error) {
                    console.error('Login failed:', error);
                    showCustomAlert('Не удалось войти: ' + error.message);
                }
            });
            return;
        }

        try {
            await initKanban();
            console.log('Kanban board initialized');

            initSaveButton();
            console.log('Save button initialized');
            initAddButtons();
            console.log('Add buttons initialized');

            const columnsContainer = document.querySelector('#columnsContainer');
            const modal = document.querySelector('.confirm-modal');

            if (!columnsContainer || !modal) {
                throw new Error('Required DOM elements not found');
            }

            modal.addEventListener('submit', (event) => {
                event.preventDefault();
                if (modal.open && currentTask) {
                    currentTask.remove();
                    modal.close();
                    currentTask = null;
                }
            });

            modal.querySelector('#cancel')?.addEventListener('click', () => modal.close());
            modal.addEventListener('close', () => currentTask = null);

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && modal.open) {
                    modal.close();
                }
            });

            initTaskPreview();
            setupDragAndDrop();

            console.log('Application fully initialized');

        } catch (initError) {
            console.error('Initialization error:', initError);
            showCustomAlert('Ошибка инициализации приложения');
        }

    } catch (globalError) {
        console.error('Fatal initialization error:', globalError);
        showCustomAlert('Критическая ошибка при загрузке приложения');
    }

    setTimeout(() => {
            initTaskPreview();
            initSaveButton();
            setupDragAndDrop();
        }, 100);
});

const observer = new MutationObserver((mutations) => {
    const kanbanContainer = document.querySelector('#columnsContainer');
    const modal = document.querySelector('.confirm-modal');

    if (kanbanContainer && modal && !kanbanContainer.dataset.initialized) {
        kanbanContainer.dataset.initialized = true;
        initKanban(true);
    }
});

// Начинаем наблюдение за всем документом
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
});

observer.observe(document.body, { childList: true, subtree: true });

const handleDelete = async (event, modal) => {
    console.log('Delete button clicked');
    const taskElement = event.target.closest('.task');
    if (!taskElement) {
        console.error('No task found for deletion');
        return;
    }

    const taskId = taskElement.dataset.id;
    console.log('Deleting task with ID:', taskId);

    if (!modal) {
        console.error('Modal not found');
        showCustomAlert('Ошибка: модальное окно не найдено');
        return;
    }

    modal.dataset.taskId = taskId;

    const preview = modal.querySelector('.preview');
    if (preview) {
        const title = taskElement.querySelector('.task-title')?.textContent || 'Удаляемая задача';
        preview.textContent = title.length > 100 ? title.slice(0, 100) + '...' : title;
    }

    // Показываем модальное окно
    if (typeof modal.showModal === 'function') {
        modal.showModal();
    } else {
        modal.style.display = 'block';
    }

    // Обработчик подтверждения удаления
    const confirmDelete = async () => {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error('Пользователь не авторизован');
            }

            // Получаем выбранный тип удаления
            const deleteType = modal.querySelector('input[name="deleteType"]:checked').value;

            // 1. Получаем текущее состояние KanbanState
            const existingState = await KanbanStorage.findExistingState(userId);
            if (!existingState) {
                throw new Error('Состояние канбана не найдено');
            }

            // 2. Парсим массив задач из состояния
            const tasks = JSON.parse(existingState.stateJson);
            if (!Array.isArray(tasks)) {
                throw new Error('Некорректный формат задач в состоянии');
            }

            // 3. Находим индекс задачи для удаления
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) {
                throw new Error('Задача не найдена в состоянии канбана');
            }

            // 4. Создаем обновленный массив без удаляемой задачи
            const updatedTasks = [...tasks.slice(0, taskIndex), ...tasks.slice(taskIndex + 1)];

            // 5. Удаление в зависимости от выбранного типа
            if (deleteType === 'kanbanOnly') {
                // Только из KanbanState
                const response = await fetch(`http://localhost:8080/rest/entities/KanbanState/${existingState.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            } else {
                // Полное удаление (из Task_ и KanbanState)

                // Сначала удаляем из Task_
                const taskDeleteResponse = await fetch(`http://localhost:8080/rest/entities/Task_/${taskId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!taskDeleteResponse.ok) {
                    throw new Error(`Ошибка удаления задачи: ${taskDeleteResponse.status}`);
                }
                // Затем, удаляем из KanbanState
            const response = await fetch(`http://localhost:8080/rest/entities/KanbanState/${existingState.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            }

            // 6. Удаляем задачу из DOM
            taskElement.remove();

            // 7. Обновляем кэш
            tasksCache.clear(userId);

            // 8. Автоматическое сохранение изменений
            await saveKanbanBoard();

            // 9. Обновляем счетчики задач
            updateTaskCounters();

            showCustomAlert(deleteType === 'kanbanOnly'
                ? 'Задача удалена из канбан-доски'
                : 'Задача полностью удалена из системы');

        } catch (error) {
            console.error('Delete error:', error);
            showCustomAlert(`Ошибка при удалении: ${error.message}`);
        } finally {
            modal.close();
        }
    };

    // Назначаем обработчик на кнопку подтверждения
    const confirmBtn = modal.querySelector('#confirm');
    confirmBtn.onclick = confirmDelete;

    // Добавляем обработчик отмены
    const cancelBtn = modal.querySelector('#cancel');
    cancelBtn.onclick = () => modal.close();
};

// Вынесем обновление счетчиков в отдельную функцию для повторного использования
function updateTaskCounters() {
    document.querySelectorAll('.column').forEach(column => {
        const taskCount = column.querySelectorAll('.task').length;
        const counterElement = column.querySelector('.task-count');
        if (counterElement) {
            counterElement.textContent = `(${taskCount})`;
        }
    });
}

if (typeof initApp === 'undefined') {      //добавлено для устранения ошибки 'initApp' has already been declared
const initApp = async (modal, columnsContainer) => {
    console.log('CALL: initApp()');
    console.log('Initializing app...');

    initSaveButton();

    if (window.userData) {
        console.log('Данные пользователя:', window.userData);
        const username = window.userData.firstName;
        console.log('Имя пользователя:', username);
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = `Добро пожаловать, ${username}!`;
        }
    } else {
        console.log('Данные пользователя не найдены.');
    }

    if (!columnsContainer) {
        console.error("columnsContainer element not found!");
        return;
    }

    if (!modal) {
        console.error("Modal element not found!");
        return;
    }

    const fetchTasksByUserIdButton = document.getElementById('fetchTasksByUserId');
    if (fetchTasksByUserIdButton) {
        fetchTasksByUserIdButton.addEventListener('click', async () => {
            await showTaskPreview();
        });
    }


// В функции initApp или аналогичной инициализации
const confirmDeleteBtn = modal.querySelector('#confirm');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        const taskId = modal.dataset.taskId;
        if (!taskId) return;

        try {
            await deleteTaskOnFromKanbanState(taskId);
            document.querySelector(`.task[data-id="${taskId}"]`)?.remove();
            tasksCache.clear(getCurrentUserId());
            showCustomAlert('Задача успешно удалена');
        } catch (error) {
            console.error('Delete failed:', error);
            showCustomAlert('Ошибка при удалении задачи: ' + (error.message || 'Неизвестная ошибка'));
        }
        modal.close();
    });
}
    // Обработчик подтверждения удаления
    const confirmDelete = modal.querySelector('#confirm');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', async () => {
            const taskId = modal.dataset.taskId;
            if (!taskId) return;

            try {
                await deleteTaskOnFromKanbanState(taskId);
                document.querySelector(`.task[data-id="${taskId}"]`)?.remove();
                tasksCache.clear(getCurrentUserId());
                showCustomAlert('Задача успешно удалена');
            } catch (error) {
                console.error('Delete failed:', error);
                showCustomAlert('Ошибка при удалении задачи: ' + (error.message || 'Неизвестная ошибка'));
            }
            modal.close();
        });
    }

    try {
        const userId = getCurrentUserId();
        console.log('Initializing app for user:', userId);

        if (userId) {
            console.log('Initializing board for user:', userId);

            const savedState = await KanbanStorage.load(userId);
            console.log('Saved state:', savedState);

            if (savedState && savedState.length > 0) {
                console.log('Rendering saved tasks');
                renderTasks(savedState, false);
            } else {
                console.log('No saved tasks, rendering empty board');
                renderTasks([], false);
            }

            const tasksElements = columnsContainer.querySelectorAll('.tasks');
            tasksElements.forEach(tasksEl => {
                tasksEl.addEventListener('dragover', handleDragover);
            });

            myFunction(columnsContainer);

            columnsContainer.addEventListener('click', event => {
                if (event.target.closest('button[data-add]')) {
                    handleAdd(event);
                } else if (event.target.closest('button[data-edit]')) {
                    handleEdit(event);
                } else if (event.target.closest('button[data-delete]')) {
                    handleDelete(event, modal);
                }
            });

            function handleColumnDragover(event) {
                event.preventDefault();
                console.log("Column Dragover");
            }

            const columns = columnsContainer.querySelectorAll('.column');
            const columnsArray = Array.from(columns);
            columnsArray.forEach(column => {
                column.addEventListener('dragover', handleColumnDragover);
            });

            observeTaskChanges(columnsArray);

            const cancelButton = modal.querySelector('#cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => modal.close());
            }

            modal.addEventListener('close', () => {
                delete modal.dataset.taskId;
            });

            modal.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    modal.querySelector('#confirm').click();
                } else if (event.key === 'Backspace') {
                    modal.close();
                }
            });

            console.log('App initialized without automatic task fetching.');
        } else {
            console.warn('User ID not found, initializing empty board');
            renderTasks([], Array.from(columnsContainer.querySelectorAll('.column')));
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showCustomAlert('Ошибка инициализации доски.');
        renderTasks([], Array.from(columnsContainer.querySelectorAll('.column')));
    }

    console.log('App initialization process completed.');
}
};

const handleDragover = event => {
    console.log('CALL: handleDragover()');
    event.preventDefault();

    const draggedTask = document.querySelector('.dragging');
    if (!draggedTask) return;

    const target = event.target.closest('.task') || event.target.closest('.tasks');
    if (!target || target === draggedTask) return;

    const targetColumn = target.closest('.column');
    if (!targetColumn) return;

    const newStatus = targetColumn.dataset.status;
    console.log('New status:', newStatus);

    // Проверка допустимости статуса
    if (!['PLANNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED'].includes(newStatus)) {
        console.error('Invalid status:', newStatus);
        return;
    }

    // Обновляем статус задачи
    const oldStatus = draggedTask.dataset.status;
    draggedTask.dataset.status = newStatus;

    // Определяем контейнер задач
    const tasksContainer = target.classList.contains('tasks')
        ? target
        : target.closest('.tasks');

    // Получаем последнюю задачу в контейнере
    const lastTask = tasksContainer?.lastElementChild;

    if (!lastTask) {
        console.log('Колонка пустая - добавляем задачу');
        tasksContainer.appendChild(draggedTask);
    } else {
        console.log('Определение позиции вставки');
        const { bottom } = lastTask.getBoundingClientRect();

        if (event.clientY > bottom) {
            console.log('Вставка в конец');
            tasksContainer.appendChild(draggedTask);
        } else {
            console.log('Вставка в начало');
            tasksContainer.insertBefore(draggedTask, tasksContainer.firstChild);
        }
    }

    // Обновляем счетчики
    document.querySelectorAll('.column').forEach(column => {
        const taskCount = column.querySelectorAll('.task').length;
        const counterElement = column.querySelector('.column-title .task-count');
        if (counterElement) {
            counterElement.textContent = `(${taskCount})`;
        }
    });

    // Если статус изменился, обновляем задачу на бэкенде
    if (oldStatus !== newStatus) {
        const taskId = draggedTask.dataset.id;
        const taskData = {
            taskTitle: draggedTask.querySelector('.task-title')?.textContent || 'Без названия',
            taskPriority: draggedTask.dataset.priority || 'MEDIUM',
            taskStatus: newStatus,
            deadline: draggedTask.dataset.deadline || new Date().toISOString()
        };

        // Обновляем задачу на бэкенде
        updateTaskOnBackend(taskId, taskData)
            .then(async updatedTask => {
                console.log('Задача успешно обновлена на бэкенде:', updatedTask);

                // 1. Сохраняем текущее состояние доски
                const userId = getCurrentUserId();
                const currentTasks = getCurrentTasks();
                await KanbanStorage.save(userId, currentTasks);
                tasksCache.set(userId, currentTasks);

                // 2. Инициализируем кнопку сохранения
                initSaveButton();

                // 3. Автоматическое обновление через 5 секунд
                setTimeout(() => {
                    tasksCache.clear(userId);
                    initKanban(true);
                    console.log('Доска автоматически обновлена через 5 секунд после изменения');
                }, 5000);
            })
            .catch(error => {
                console.error('Ошибка при обновлении задачи:', error);
                showCustomAlert('Не удалось обновить статус задачи: ' + error.message);

                // Возвращаем задачу в исходную колонку в случае ошибки
                const originalColumn = document.querySelector(`.column[data-status="${oldStatus}"]`);
                if (originalColumn) {
                    originalColumn.querySelector('.tasks').appendChild(draggedTask);
                    draggedTask.dataset.status = oldStatus;

                    // Обновляем счетчики после возврата
                    document.querySelectorAll('.column').forEach(column => {
                        const taskCount = column.querySelectorAll('.task').length;
                        const counterElement = column.querySelector('.column-title .task-count');
                        if (counterElement) {
                            counterElement.textContent = `(${taskCount})`;
                        }
                    });
                }
            });
    }
};

const handleDragend = event => {
    console.log('CALL: handleDragend()');
    event.target.classList.remove('dragging');
}

const handleDragstart = event => {
    console.log('CALL: handleDragstart()');
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plan', '');
    requestAnimationFrame(() => event.target.classList.add('dragging'));
}

const handleEdit = event => {
    console.log('CALL: handleEdit()');
    const task = event.target.closest('.task');
    const title = task.querySelector('.task-title').textContent;
    const priority = task.dataset.priority;
    const status = task.dataset.status;
    const deadline = task.dataset.deadline;

    const inputContainer = createTaskInput(title, task);
    inputContainer.querySelector('.task-priority').value = priority;
    inputContainer.querySelector('.task-status').value = status;
    inputContainer.querySelector('.task-deadline').value = deadline.slice(0, 16);

    task.replaceWith(inputContainer);
    inputContainer.querySelector('.task-input').focus();
};

const handleBlur = event => {
    console.log('CALL: handleBlur()');
    const input = event.target;
    const container = input.parentElement;
    const content = input.value.trim();

    if (!content) {
        console.log('Поле ввода пустое - удаляем');
        container.remove();
        return;
    }

    console.log('Создание новой задачи из ввода');
    const task = createTask(content.replace(/\n/g, '</br>'));
    container.replaceWith(task);
};

//const handleAdd = event => {
//    console.log('Add button clicked');
//    const button = event.currentTarget;
//    const column = button.closest('.column');
//
//    if (!column) {
//        console.error('Column not found');
//        return;
//    }
//
//    const tasksContainer = column.querySelector('.tasks');
//    if (!tasksContainer) {
//        console.error('Tasks container not found');
//        return;
//    }
//
//    // Создаем форму для новой задачи
//    const inputContainer = createTaskInput();
//
//    // Вставляем форму в начало списка задач
//    tasksContainer.prepend(inputContainer);
//
//    // Фокусируемся на поле ввода
//    inputContainer.querySelector('.task-input').focus();
//};

const handleAdd = event => {
    console.log('Add button clicked');
    const button = event.currentTarget;
    const column = button.closest('.column');

    if (!column) {
        console.error('Column not found');
        return;
    }

    const tasksContainer = column.querySelector('.tasks');
    if (!tasksContainer) {
        console.error('Tasks container not found');
        return;
    }

    // Создаем форму для новой задачи
    const inputContainer = createTaskInput();

    // Вставляем форму в начало списка задач
    tasksContainer.prepend(inputContainer);

    // Фокусируемся на поле ввода
    inputContainer.querySelector('.task-input').focus();

    // Добавляем обработчик для автоматического сохранения при потере фокуса
    inputContainer.querySelector('.task-input').addEventListener('blur', async () => {
        try {
            const userId = getCurrentUserId();
            const currentTasks = getCurrentTasks();
            await KanbanStorage.save(userId, currentTasks);
            console.log('Autosaved kanban state after adding new task');
        } catch (error) {
            console.error('Autosave failed:', error);
        }
    });
};

const updateTaskCount = column => {
    console.log('CALL: updateTaskCount()');
    const tasks = column.querySelector('.tasks').children;
    const taskCount = tasks.length;
    const titleElement = column.querySelector('.column-title h3');
    if (titleElement) {
        titleElement.dataset.tasks = taskCount;
    }
}



const observeTaskChanges = (columns) => {
    console.log('CALL: observeTaskChanges()');
    const observers = [];
    if (columns) {
        for (const column of columns) {
            const observer = new MutationObserver(() => {
                console.log('MutationObserver: изменение в колонке');
                updateTaskCount(column);
            });
            observer.observe(column.querySelector('.tasks'), { childList: true });
            observers.push(observer);
        }
    }
    return observers;
}

observeTaskChanges();

//function createTask(title, priority, status, deadline, id) {
//    console.log('CALL: createTask()');
//    const task = document.createElement('div');
//    task.className = 'task';
//    task.draggable = true;
//    task.dataset.id = id;
//    task.dataset.priority = priority;
//    task.dataset.deadline = deadline;
//    task.dataset.status = status;
//
//    task.innerHTML = `
//           <div class="task-title">${title}</div>
//           <div class="task-priority">Приоритет: ${getPriorityText(priority)}</div>
//           <div class="task-status">Статус: ${getStatusText(status)}</div>
//           <div class="task-deadline">Дедлайн: ${new Date(deadline).toLocaleString()}</div>
//           <menu>
//               <button data-edit class="update-button">
//                   <i class="bi bi-pencil-square"></i>
//               </button>
//               <button data-delete class="delete-button">
//                   <i class="bi bi-trash"></i>
//               </button>
//           </menu>
//       `;
//
//
//    // Добавьте обработчики сразу при создании
//    task.querySelector('[data-edit]').addEventListener('click', handleEdit);
//
//    task.querySelector('[data-delete]').addEventListener('click', (e) => {
//    e.stopPropagation(); // Предотвращаем всплытие события
//    const modal = document.querySelector('.confirm-modal');
//    if (modal) {
//        handleDelete(e, modal);
//    } else {
//        console.error('Confirm modal not found');
//        showCustomAlert('Ошибка: окно подтверждения не найдено');
//    }
//});
//    task.addEventListener('dragstart', handleDragstart);
//    task.addEventListener('dragend', handleDragend);
//
//// Автоматически сохраняем состояние канбана после создания задачи
//    setTimeout(async () => {
//        try {
//            const userId = getCurrentUserId();
//            const currentTasks = getCurrentTasks();
//            await KanbanStorage.save(userId, currentTasks);
//            tasksCache.set(userId, currentTasks);
//            console.log('Kanban state autosaved after task creation');
//        } catch (error) {
//            console.error('Autosave failed:', error);
//        }
//    }, 100);
//
//    return task;
//}

//======================================================
//                    15.07.25

function createTask(title, priority, status, deadline, id) {
    console.log('CALL: createTask()');
    const task = document.createElement('div');
    task.className = 'task';
    task.draggable = true;
    task.dataset.id = id;
    task.dataset.priority = priority;
    task.dataset.deadline = deadline;
    task.dataset.status = status;

    task.innerHTML = `
        <div class="task-title">${title}</div>
        <div class="task-priority">Приоритет: ${getPriorityText(priority)}</div>
        <div class="task-status">Статус: ${getStatusText(status)}</div>
        <div class="task-deadline">Дедлайн: ${new Date(deadline).toLocaleString()}</div>
        <menu>
            <button data-go-to-task class="go-to-task-button" title="Перейти к деталям задачи" ${!id ? 'disabled' : ''}>
                <i class="fas fa-external-link-alt"></i>
            </button>
            <button data-edit class="update-button" title="Обновить задачу">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button data-delete class="delete-button" title="Удалить задачу">
                <i class="bi bi-trash"></i>
            </button>
        </menu>
    `;

    // Добавляем обработчики
    task.querySelector('[data-edit]').addEventListener('click', handleEdit);
    task.querySelector('[data-delete]').addEventListener('click', (e) => {
        e.stopPropagation();
        const modal = document.querySelector('.confirm-modal');
        if (modal) {
            handleDelete(e, modal);
        }
    });

    // Обработчик для кнопки "Перейти к задаче"
    const goToTaskBtn = task.querySelector('[data-go-to-task]');
    if (goToTaskBtn && id) { // Проверяем, что id существует
        goToTaskBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем всплытие события, чтобы не мешать другим обработчикам задачи

            if (id && isValidUUID(id)) {
                window.open(`http://localhost:8080/tasks/${id}`, '_blank');
            } else {
                console.error('Invalid taskId for navigation:', id);
                showCustomAlert('Не удалось перейти к задаче: неверный идентификатор');
            }
        });
    }

    task.addEventListener('dragstart', handleDragstart);
    task.addEventListener('dragend', handleDragend);

    // Автоматически сохраняем состояние канбана после создания задачи
    setTimeout(async () => {
        try {
            const userId = getCurrentUserId();
            const currentTasks = getCurrentTasks();
            await KanbanStorage.save(userId, currentTasks);
            tasksCache.set(userId, currentTasks);
            console.log('Kanban state autosaved after task creation');
        } catch (error) {
            console.error('Autosave failed:', error);
        }
    }, 100);

    return task;
}


function isValidUUID(uuid) {
    // A more general regex for UUIDs.
    // It checks for the pattern xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit.
    // The 'i' flag ensures case-insensitivity.
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

// Функция для показа кастомного alert
function showCustomAlert(message) {
    alert(message);
}

//======================================================

const createTaskInput = (text = '', originalTask = null) => {
    console.log('CALL: createTaskInput()');
    const container = document.createElement('div');
    container.className = 'task-input-container';

    // Получаем данные текущего пользователя
    const userId = getCurrentUserId();
    let username = 'Неизвестный пользователь';
    try {
        if (window.userData?.username) {
            username = window.userData.username;
        } else {
            const storedUser = JSON.parse(localStorage.getItem('userData'));
            if (storedUser?.username) username = storedUser.username;
        }
    } catch (e) {
        console.error('Ошибка получения данных пользователя:', e);
    }

    // Поле ввода названия задачи
    const input = document.createElement('textarea');
    input.className = 'task-input';
    input.placeholder = 'Введите название задачи';
    input.value = text;
    container.appendChild(input);

    // Скрытое поле с информацией о пользователе
    const userInfoField = document.createElement('input');
    userInfoField.type = 'hidden';
    userInfoField.className = 'task-user-info';
    userInfoField.value = JSON.stringify({
        userId: userId,
        username: username,
        modifiedAt: new Date().toISOString()
    });
    container.appendChild(userInfoField);

    // Поле выбора приоритета
       const priorityLabel = document.createElement('label');
       priorityLabel.textContent = 'Приоритет:';
       container.appendChild(priorityLabel);

       const prioritySelect = document.createElement('select');
       prioritySelect.className = 'task-priority';
       for (const [value, label] of Object.entries(PRIORITY_TEXT_MAP)) {
           const option = document.createElement('option');
           option.value = value;
           option.textContent = label;
           prioritySelect.appendChild(option);
       }
       container.appendChild(prioritySelect);

       // Поле выбора статуса
       const statusLabel = document.createElement('label');
       statusLabel.textContent = 'Статус:';
       container.appendChild(statusLabel);

       const statusSelect = document.createElement('select');
       statusSelect.className = 'task-status';
       for (const [value, label] of Object.entries(STATUS_TEXT_MAP)) {
           const option = document.createElement('option');
           option.value = value;
           option.textContent = label;
           statusSelect.appendChild(option);
       }
       container.appendChild(statusSelect);

    // Поле ввода дедлайна
    const deadlineLabel = document.createElement('label');
    deadlineLabel.textContent = 'Дедлайн:';
    container.appendChild(deadlineLabel);

    const deadlineInput = document.createElement('input');
    deadlineInput.type = 'datetime-local';
    deadlineInput.className = 'task-deadline';
    container.appendChild(deadlineInput);

    // Кнопки управления
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';

    // Кнопка отмены
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.innerHTML = '<i class="fas fa-times"></i>';
    cancelButton.addEventListener('click', () => {
        if (originalTask) {
            container.replaceWith(originalTask);
        } else {
            container.remove();
        }
    });
    buttonsContainer.appendChild(cancelButton);

    // Кнопка сохранения
    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.innerHTML = '<i class="fas fa-check"></i>';

    saveButton.addEventListener('click', async () => {
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            // Валидация данных
            const content = input.value.trim();
            if (!content) throw new Error('Название задачи не может быть пустым');

            const deadlineValue = deadlineInput.value;
            if (!deadlineValue) throw new Error('Не указан дедлайн задачи');

            // Формируем данные задачи
            const userInfo = JSON.parse(userInfoField.value);
            const taskData = {
                taskTitle: content,
                taskPriority: prioritySelect.value,
                taskStatus: statusSelect.value,
                deadline: new Date(deadlineValue).toISOString(),
                createdBy: userInfo.userId,
                createdByName: userInfo.username,
                lastModified: userInfo.modifiedAt,
                lastModifiedBy: userInfo.userId
            };

            // Дополнительные поля для статусов
            if (taskData.taskStatus === 'UNDER_REVIEW') {
                taskData.reviewerId = userInfo.userId;
                taskData.reviewerName = userInfo.username;
                taskData.reviewStarted = new Date().toISOString();
            }

            if (taskData.taskStatus === 'COMPLETED') {
                taskData.completedBy = userInfo.userId;
                taskData.completedByName = userInfo.username;
                taskData.completionDate = new Date().toISOString();

                // Проверка дедлайна
                if (new Date(deadlineValue) > new Date() &&
                   !confirm('Задача завершена раньше дедлайна. Продолжить?')) {
                    throw new Error('Подтверждение отменено пользователем');
                }
            }

            // Обработка сохранения
            if (originalTask) {
                // Редактирование существующей задачи
                const updatedTask = await updateTaskOnBackend(originalTask.dataset.id, taskData);
                if (!updatedTask) throw new Error('Не удалось обновить задачу');

                const newTaskElement = createTask(
                    updatedTask.taskTitle,
                    updatedTask.taskPriority,
                    updatedTask.taskStatus,
                    updatedTask.deadline,
                    updatedTask.id
                );

                // Перемещение при изменении статуса
                if (updatedTask.taskStatus !== originalTask.dataset.status) {
                    const newColumn = document.querySelector(`.column[data-status="${updatedTask.taskStatus}"] .tasks`);
                    if (newColumn) {
                        container.replaceWith(newTaskElement);
                        newColumn.appendChild(newTaskElement);
                    } else {
                        container.replaceWith(newTaskElement);
                    }
                } else {
                    container.replaceWith(newTaskElement);
                }

                // Обновление кэша
                const cachedTasks = tasksCache.get(userId) || [];
                const index = cachedTasks.findIndex(t => t.id === originalTask.dataset.id);
                if (index !== -1) {
                    cachedTasks[index] = updatedTask;
                    tasksCache.set(userId, cachedTasks);
                }

                showCustomAlert('Задача успешно обновлена!');
            } else {
                // Создание новой задачи
                const createdTask = await createTaskOnBackend(taskData);
                if (!createdTask) throw new Error('Не удалось создать задачу');

                const newTaskElement = createTask(
                    createdTask.taskTitle,
                    createdTask.taskPriority,
                    createdTask.taskStatus,
                    createdTask.deadline,
                    createdTask.id
                );

                // Добавление в соответствующую колонку
                const targetColumn = document.querySelector(`.column[data-status="${createdTask.taskStatus}"] .tasks`);
                (targetColumn || document.querySelector('.column .tasks')).appendChild(newTaskElement);

                // Обновление кэша
                const cachedTasks = tasksCache.get(userId) || [];
                tasksCache.set(userId, [...cachedTasks, createdTask]);

                showCustomAlert('Новая задача успешно создана!');

                // Очистка формы для новых задач
                if (!originalTask) {
                    input.value = '';
                    prioritySelect.value = 'MEDIUM';
                    statusSelect.value = 'PLANNED';
                    deadlineInput.value = '';
                }
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            showCustomAlert(`Ошибка: ${error.message}`);
            if (originalTask) container.replaceWith(originalTask);
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-check"></i>';
        }
    });

    buttonsContainer.appendChild(saveButton);
    container.appendChild(buttonsContainer);

    // Обработка Enter для сохранения
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveButton.click();
        }
    });

    return container;
};

function validateTaskStatus(status) {
    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Недопустимый статус задачи: ${status}`);
    }

    // Дополнительные проверки для специфичных статусов
//    if (status === 'UNDER_REVIEW') {
//        if (!getCurrentUserId()) {
//            throw new Error('Необходимо указать рецензента для статуса "На проверке"');
//        }
//    }

    if (status === 'COMPLETED') {
        const now = new Date();
        const deadline = new Date(deadlineInput.value);
        if (deadline > now) {
            if (!confirm('Задача завершена раньше дедлайна. Продолжить?')) {
                throw new Error('Подтверждение отменено');
            }
        }
    }
}

function myFunction(columnsContainer) {
    console.log('CALL: myFunction()');
    const tasksElements = columnsContainer.querySelectorAll('.tasks');
    for (const tasksEl of tasksElements) {
        tasksEl.addEventListener('dragover', handleDragover);
    }
}

// Обновлённая функция renderTasks
function renderTasks(tasks, shouldAppend = false) {
    console.log('CALL: renderTasks()');
    console.log('Полученные задачи для рендеринга:', tasks);

    const validatedTasks = (tasks || []).map(task => ({
        id: task.id || generateId(),
        taskTitle: task.taskTitle || task.title || 'Новая задача',
        taskPriority: task.taskPriority || task.priority || 'MEDIUM',
        taskStatus: task.taskStatus || task.status,
        deadline: task.deadline || new Date().toISOString()
    }));

    if (!shouldAppend) {
        console.log('Очистка колонок перед рендерингом');
        document.querySelectorAll('.column .tasks').forEach(container => {
            container.innerHTML = '';
        });
    }

    validatedTasks.forEach(task => {
        try {
            const column = Array.from(document.querySelectorAll('.column')).find(col => {
                return col.dataset.status === task.taskStatus;
            });

            if (column) {
                const existingTask = column.querySelector(`.task[data-id="${task.id}"]`);
                if (!existingTask) {
                    const taskElement = createTask(
                        task.taskTitle,
                        task.taskPriority,
                        task.taskStatus,
                        task.deadline,
                        task.id
                    );
                    column.querySelector('.tasks').appendChild(taskElement);
                }
            } else {
                console.warn(`Не найдена колонка для статуса: ${task.taskStatus}`);
                const firstColumn = document.querySelector('.column');
                if (firstColumn && !firstColumn.querySelector(`.task[data-id="${task.id}"]`)) {
                    const taskElement = createTask(
                        task.taskTitle,
                        task.taskPriority,
                        'PLANNED',
                        task.deadline,
                        task.id
                    );
                    firstColumn.querySelector('.tasks').appendChild(taskElement);
                }
            }
        } catch (error) {
            console.error('Ошибка при рендеринге задачи:', task, error);
        }
    });

    setTimeout(() => {
        document.querySelectorAll('.task [data-edit]').forEach(btn => {
            btn.removeEventListener('click', handleEdit);
            btn.addEventListener('click', handleEdit);
        });

        document.querySelectorAll('.task [data-delete]').forEach(btn => {
            btn.removeEventListener('click', handleDelete);
            btn.addEventListener('click', (e) => {
                const modal = document.querySelector('.confirm-modal');
                handleDelete(e, modal);
            });
        });

        setupDragAndDrop();
    }, 100);
}

if (window.Vaadin?.Flow?.navigation) {
    window.Vaadin.Flow.navigation.on('vaadin-navigated', (event) => {
        if (event.detail.route === 'kanban-view') {
            console.log('Kanban route detected, reinitializing...');
            kanbanInitialized = false; // Сбрасываем флаг
            initKanban(true);
        }
    });
}

