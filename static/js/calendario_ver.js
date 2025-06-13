let currentDate = new Date();
let events = [];
let selectedDate = null;
let selectedColor = 'red';
let editingEventId = null;

const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

document.addEventListener('DOMContentLoaded', () => {
    initCalendar(); 
    cargarEventosDesdeServidor(); 
});

function initCalendar() {
    renderCalendar();
    renderEventsList();
}

function cargarEventosDesdeServidor() {
    fetch("/secciones/obtener-eventos")
        .then(res => res.json())
        .then(data => {
            if (data.success && Array.isArray(data.events)) {
                events = data.events;
                renderCalendar();
                renderEventsList();
            } else {
                console.error("No se pudieron cargar los eventos");
            }
        })
        .catch(err => {
            console.error("Error al obtener eventos:", err);
        });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('currentMonth').textContent = `${months[month]} ${year}`;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarGrid = document.getElementById('calendarGrid');
    const dayHeaders = [...calendarGrid.querySelectorAll('.day-header')]; 
    calendarGrid.innerHTML = '';
    dayHeaders.forEach(header => calendarGrid.appendChild(header));

    const today = new Date();

    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.onclick = () => openModal(cellDate);

        if (cellDate.getMonth() !== month) {
            dayCell.classList.add('other-month');
        }

        if (
            cellDate.getDate() === today.getDate() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getFullYear() === today.getFullYear()
        ) {
            dayCell.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = cellDate.getDate();
        dayCell.appendChild(dayNumber);

        renderEventsForDay(dayCell, cellDate);
        calendarGrid.appendChild(dayCell);
    }
}

function renderEventsForDay(dayCell, cellDate) {
    const dayEvents = events.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        return cellDate >= startDate && cellDate <= endDate;
    });

    dayEvents.forEach(event => {
        const eventBar = document.createElement('div');
        eventBar.className = `event-bar color-${event.color}`;

        eventBar.textContent = event.title;
        eventBar.onclick = (e) => {
            e.stopPropagation();
            editEvent(event.id);
        };

        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        if (startDate.toDateString() === cellDate.toDateString() && endDate.toDateString() === cellDate.toDateString()) {
            eventBar.classList.add('single');
        } else if (startDate.toDateString() === cellDate.toDateString()) {
            eventBar.classList.add('start');
        } else if (endDate.toDateString() === cellDate.toDateString()) {
            eventBar.classList.add('end');
        } else {
            eventBar.classList.add('middle');
        }

        dayCell.appendChild(eventBar);
    });
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-color="${color}"]`).classList.add('selected');
}

function openModal(date) {
    editingEventId = null;
    selectedDate = date;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    document.getElementById('modalTitle').textContent = '➕ Agregar Evento';
    document.getElementById('saveBtn').textContent = 'Agregar Evento';
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventStartDate').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('eventEndDate').value = `${yyyy}-${mm}-${dd}`;
    selectedColor = 'red';
    selectColor('red');
    document.getElementById('eventModal').style.display = 'block';
    document.getElementById('eventTitle').focus();
}

function editEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    editingEventId = id;
    document.getElementById('modalTitle').textContent = '✏️ Editar Evento';
    document.getElementById('saveBtn').textContent = 'Actualizar Evento';
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventStartDate').value = event.startDate;
    document.getElementById('eventEndDate').value = event.endDate;
    selectedColor = event.color;
    selectColor(event.color);
    document.getElementById('eventModal').style.display = 'block';
    document.getElementById('eventTitle').focus();
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
    document.getElementById('eventForm').reset();
    editingEventId = null;
    selectedColor = 'red';
    selectColor('red');
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    renderEventsList();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    renderEventsList();
}

function saveEvent(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value.trim();
    const startDate = document.getElementById('eventStartDate').value;
    const endDate = document.getElementById('eventEndDate').value;

    if (!title || !startDate || !endDate || !selectedColor) {
        alert("⚠️ Todos los campos son obligatorios");
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert("❌ La fecha de inicio no puede ser posterior a la fecha de fin");
        return;
    }

    const evento = {
        id: editingEventId || Date.now(),
        title,
        startDate,
        endDate,
        color: selectedColor
    };

    fetch("/secciones/guardar-evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evento)
    })
        .then(res => res.json())
        .then(() => {
            if (editingEventId) {
                const index = events.findIndex(e => e.id === evento.id);
                if (index !== -1) {
                    events[index] = evento;
                } else {
                    events.push(evento);
                }
            } else {
                events.push(evento);
            }

            closeModal();
            renderCalendar();
            renderEventsList();
        })
        .catch(err => {
            alert("❌ Error al guardar el evento");
            console.error(err);
        });
}



function renderEventsList() {
    const eventsList = document.getElementById('eventsList');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthEvents = events.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        return startDate <= monthEnd && endDate >= monthStart;
    });

    if (monthEvents.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No hay eventos este mes</p>';
        return;
    }

    eventsList.innerHTML = monthEvents.map(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const formatDate = (date) =>
            date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        const dateRange = startDate.toDateString() === endDate.toDateString()
            ? formatDate(startDate)
            : `${formatDate(startDate)} - ${formatDate(endDate)}`;

        return `
            <div class="event-item">
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-dates">${dateRange}</div>
                </div>
                <div class="event-actions">
                    <button class="edit-btn" onclick="editEvent(${event.id})" title="Editar evento">✏️</button>
                    <button class="delete-btn" onclick="deleteEvent(${event.id})" title="Eliminar evento">🗑️</button>
                </div>
            </div>`;
    }).join('');
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        closeModal();
    }
};