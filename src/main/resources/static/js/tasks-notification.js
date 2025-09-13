// Глобальные переменные
let tasksNotificationBtn = null;
let tasksBadge = null;
let currentTasksCount = 0;
let checkInterval = null;

// Инициализация уведомлений о задачах
function initTasksNotification() {
    createNotificationButton();
    startPolling();
    setupEventListeners();
    console.log('Уведомления о задачах инициализированы');
}

// Создание кнопки уведомлений
function createNotificationButton() {
    // Создаем кнопку
    tasksNotificationBtn = document.createElement('button');
    tasksNotificationBtn.id = 'tasksNotificationBtn';
    tasksNotificationBtn.style.cssText = `
position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    `;

    // Создаем иконку
    const icon = document.createElement('i');
    icon.className = 'fas fa-tasks';

    // Создаем текст
    const text = document.createElement('span');
    text.textContent = 'Мои задачи';
    text.id = 'tasksButtonText';

    // Создаем бейдж для отображения количества
    tasksBadge = document.createElement('span');
    tasksBadge.id = 'tasksBadge';
    tasksBadge.style.cssText = `
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        display: none;
    `;

    // Собираем кнопку
    tasksNotificationBtn.appendChild(icon);
    tasksNotificationBtn.appendChild(text);
    tasksNotificationBtn.appendChild(tasksBadge);

    // Добавляем кнопку на страницу
    document.body.appendChild(tasksNotificationBtn);
}

// Запрос количества задач
async function fetchTasksCount() {
    try {
        const response = await fetch('/rest/entities/Task_/incomplete-count');
        if (response.ok) {
            const data = await response.json();
            updateNotification(data.count);
        }
    } catch (error) {
        console.error('Ошибка при получении количества задач:', error);
    }
}

// Обновление уведомления
function updateNotification(count) {
    if (count !== currentTasksCount) {
        currentTasksCount = count;

        if (count > 0) {
            // Показываем бейдж с количеством
            tasksBadge.textContent = count > 99 ? '99+' : count.toString();
            tasksBadge.style.display = 'flex';

            // Меняем стиль для привлечения внимания
            tasksNotificationBtn.style.background = '#e74c3c';
            tasksNotificationBtn.style.boxShadow = '0 2px 15px rgba(231, 76, 60, 0.4)';

            // Добавляем анимацию пульсации
            addPulseAnimation();
        } else {
            // Скрываем бейдж и возвращаем обычный стиль
            tasksBadge.style.display = 'none';
            tasksNotificationBtn.style.background = '#3498db';
            tasksNotificationBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            tasksNotificationBtn.style.animation = 'none';
        }
    }
}

// Добавление CSS анимации
function addPulseAnimation() {
    if (!document.getElementById('pulseAnimation')) {
        const style = document.createElement('style');
        style.id = 'pulseAnimation';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 2px 15px rgba(231, 76, 60, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 2px 20px rgba(231, 76, 60, 0.6); }
                100% { transform: scale(1); box-shadow: 0 2px 15px rgba(231, 76, 60, 0.4); }
            }
            #tasksNotificationBtn {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

// Показать модальное окно с задачами
function showTasksModal() {
    // Проверяем, не открыто ли уже модальное окно
    if (document.getElementById('tasksModal')) {
        return;
    }

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.id = 'tasksModal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        z-index: 1001;
        justify-content: center;
        align-items: center;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; text-align: center; position: relative;">
            <h3 style="margin-top: 0; color: #2c3e50;">Незавершенные задачи</h3>
            <p style="font-size: 18px; color: #27ae60; margin: 20px 0;">
                У вас ${currentTasksCount} ${getTaskWord(currentTasksCount)}
            </p>
            <div style="margin: 20px 0;">
                <a href="/tasks" id="goToTasksLink" style="padding: 12px 24px; background: #3498db; color: white;
                   text-decoration: none; border-radius: 5px; display: inline-block;
                   transition: background-color 0.3s ease;"
                   onmouseover="this.style.background='#2980b9'"
                   onmouseout="this.style.background='#3498db'">
                    Перейти к задачам
                </a>
            </div>
            <button id="closeTasksModal" style="padding: 10px 20px;
                background: #95a5a6; color: white; border: none; border-radius: 5px;
                cursor: pointer; transition: background-color 0.3s ease;"
                onmouseover="this.style.background='#7f8c8d'"
                onmouseout="this.style.background='#95a5a6'">
                Закрыть
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Обработчики для закрытия
    document.getElementById('closeTasksModal').addEventListener('click', closeTasksModal);

    // Обработчик для ссылки "Перейти к задачам" - закрывает модальное окно
    document.getElementById('goToTasksLink').addEventListener('click', function(e) {
        // Закрываем модальное окно перед переходом
        closeTasksModal();

        // Дополнительная задержка для плавного закрытия
        setTimeout(() => {
            // Переход произойдет автоматически по href ссылки
        }, 100);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeTasksModal();
        }
    });
}

// Закрыть модальное окно
function closeTasksModal() {
    const modal = document.getElementById('tasksModal');
    if (modal) {
        // Добавляем анимацию fade out
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

// Полуcorrect правильную форму слова
function getTaskWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'незавершенная задача';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
        return 'незавершенные задачи';
    }
    return 'незавершенных задач';
}

// Запуск периодической проверки
function startPolling() {
    // Первая проверка сразу
    fetchTasksCount();

    // Периодическая проверка каждые 30 секунд
    checkInterval = setInterval(fetchTasksCount, 30000);
}

// Настройка обработчиков событий
function setupEventListeners() {
    if (tasksNotificationBtn) {
        tasksNotificationBtn.addEventListener('click', showTasksModal);
    }

    // Закрытие по Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTasksModal();
        }
    });
}

// Очистка интервалов при разгрузке страницы
function cleanup() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем уведомления о задачах...');
    initTasksNotification();
});

// Резервная инициализация если DOM уже загружен
if (document.readyState !== 'loading') {
    console.log('DOM уже загружен, запускаем инициализацию уведомлений...');
    setTimeout(initTasksNotification, 100);
}

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', cleanup);