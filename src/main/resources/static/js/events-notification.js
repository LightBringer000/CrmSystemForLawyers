// Глобальные переменные для событий
let eventsNotificationBtn = null;
let eventsBadge = null;
let currentEventsCount = 0;
let eventsCheckInterval = null;

// Инициализация уведомлений о событиях
function initEventsNotification() {
    createEventsNotificationButton();
    startEventsPolling();
    setupEventsEventListeners();
    console.log('Уведомления о событиях инициализированы');
}

// Создание кнопки уведомлений о событиях
function createEventsNotificationButton() {
// Ждём, пока кнопка задач появится на странице
    const tasksBtn = document.getElementById('tasksNotificationBtn');
    if (!tasksBtn) {
        // Если кнопка задач ещё не существует, повторяем попытку через короткое время
        setTimeout(createEventsNotificationButton, 100);
        return;
    }

    eventsNotificationBtn = document.createElement('button');
    eventsNotificationBtn.id = 'eventsNotificationBtn';

    // Вычисляем новую позицию
    const newTop = tasksBtn.offsetTop + tasksBtn.offsetHeight + 10; // 10px - отступ между кнопками

    eventsNotificationBtn.style.cssText = `
        position: fixed;
        top: ${newTop}px;
        right: 20px;
        padding: 12px 24px;
        background: #9b59b6;
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
    icon.className = 'fas fa-calendar-alt';

    // Создаем текст
    const text = document.createElement('span');
    text.textContent = 'Мои события';
    text.id = 'eventsButtonText';

    // Создаем бейдж для отображения количества
    eventsBadge = document.createElement('span');
    eventsBadge.id = 'eventsBadge';
    eventsBadge.style.cssText = `
        background: #e67e22;
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
    eventsNotificationBtn.appendChild(icon);
    eventsNotificationBtn.appendChild(text);
    eventsNotificationBtn.appendChild(eventsBadge);

    // Добавляем кнопку на страницу
    document.body.appendChild(eventsNotificationBtn);
}

// Запрос количества предстоящих событий
async function fetchEventsCount() {
    try {
        const response = await fetch('/rest/entities/Event/upcoming-count');
        if (response.ok) {
            const data = await response.json();
            updateEventsNotification(data.count);
        }
    } catch (error) {
        console.error('Ошибка при получении количества событий:', error);
    }
}

// Обновление уведомления о событиях
function updateEventsNotification(count) {
    if (count !== currentEventsCount) {
        currentEventsCount = count;

        if (count > 0) {
            // Показываем бейдж с количеством
            eventsBadge.textContent = count > 99 ? '99+' : count.toString();
            eventsBadge.style.display = 'flex';

            // Меняем стиль для привлечения внимания
            eventsNotificationBtn.style.background = '#e67e22';
            eventsNotificationBtn.style.boxShadow = '0 2px 15px rgba(230, 126, 34, 0.4)';

            // Добавляем анимацию пульсации
            addEventsPulseAnimation();
        } else {
            // Скрываем бейдж и возвращаем обычный стиль
            eventsBadge.style.display = 'none';
            eventsNotificationBtn.style.background = '#9b59b6';
            eventsNotificationBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            eventsNotificationBtn.style.animation = 'none';
        }
    }
}

// Добавление CSS анимации для событий
function addEventsPulseAnimation() {
    if (!document.getElementById('eventsPulseAnimation')) {
        const style = document.createElement('style');
        style.id = 'eventsPulseAnimation';
        style.textContent = `
            @keyframes eventsPulse {
                0% { transform: scale(1); box-shadow: 0 2px 15px rgba(230, 126, 34, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 2px 20px rgba(230, 126, 34, 0.6); }
                100% { transform: scale(1); box-shadow: 0 2px 15px rgba(230, 126, 34, 0.4); }
            }
            #eventsNotificationBtn {
                animation: eventsPulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

// Показать модальное окно с событиями
function showEventsModal() {
    // Проверяем, не открыто ли уже модальное окно
    if (document.getElementById('eventsModal')) {
        return;
    }

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.id = 'eventsModal';
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
            <h3 style="margin-top: 0; color: #2c3e50;">Предстоящие события</h3>
            <p style="font-size: 18px; color: #27ae60; margin: 20px 0;">
                У вас ${currentEventsCount} ${getEventWord(currentEventsCount)}
            </p>
            <div style="margin: 20px 0;">
                <a href="/events" id="goToEventsLink" style="padding: 12px 24px; background: #9b59b6; color: white;
                   text-decoration: none; border-radius: 5px; display: inline-block;
                   transition: background-color 0.3s ease;"
                   onmouseover="this.style.background='#8e44ad'"
                   onmouseout="this.style.background='#9b59b6'">
                    Перейти к событиям
                </a>
            </div>
            <button id="closeEventsModal" style="padding: 10px 20px;
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
    document.getElementById('closeEventsModal').addEventListener('click', closeEventsModal);

    // Обработчик для ссылки "Перейти к событиям"
    document.getElementById('goToEventsLink').addEventListener('click', function(e) {
        closeEventsModal();
        setTimeout(() => {}, 100);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEventsModal();
        }
    });
}

// Закрыть модальное окно событий
function closeEventsModal() {
    const modal = document.getElementById('eventsModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
}

// Правильная форма слова для событий
function getEventWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'предстоящее событие';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
        return 'предстоящих события';
    }
    return 'предстоящих событий';
}

// Запуск периодической проверки событий
function startEventsPolling() {
    // Первая проверка сразу
    fetchEventsCount();

    // Периодическая проверка каждые 30 секунд
    eventsCheckInterval = setInterval(fetchEventsCount, 30000);
}

// Настройка обработчиков событий
function setupEventsEventListeners() {
    if (eventsNotificationBtn) {
        eventsNotificationBtn.addEventListener('click', showEventsModal);
    }

    // Закрытие по Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEventsModal();
        }
    });
}

// Очистка интервалов
function cleanupEvents() {
    if (eventsCheckInterval) {
        clearInterval(eventsCheckInterval);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем уведомления о событиях...');
    initEventsNotification();
});

// Резервная инициализация
if (document.readyState !== 'loading') {
    setTimeout(initEventsNotification, 100);
}

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', cleanupEvents);