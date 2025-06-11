document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        editable: true,
        selectable: true,
        events: [], //  desde Flask o BD después
        dateClick: function (info) {
            openModal('add', info.dateStr);
        },
        eventContent: function (arg) {
            let title = document.createElement('div');
            title.innerHTML = arg.event.title;
            title.style.fontSize = '0.9rem';

            let btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.justifyContent = 'space-between';
            btnContainer.style.fontSize = '1.2rem';
            btnContainer.style.marginTop = '4px';

            // Botón de editar
            let editBtn = document.createElement('button');
            editBtn.innerText = '✏️';
            editBtn.style.background = 'none';
            editBtn.style.border = 'none';
            editBtn.style.cursor = 'pointer';
            editBtn.style.fontSize = '1.2rem';
            editBtn.onclick = function () {
                openModal('edit', arg.event);
            };

            // Botón de eliminar
            let deleteBtn = document.createElement('button');
            deleteBtn.innerText = '🗑️';
            deleteBtn.style.background = 'none';
            deleteBtn.style.border = 'none';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '1.2rem';
            deleteBtn.onclick = function () {
                if (confirm("¿Eliminar este evento?")) {
                    arg.event.remove();
                }
            };

            btnContainer.appendChild(editBtn);
            btnContainer.appendChild(deleteBtn);

            let wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.height = '100%';
            wrapper.appendChild(title);
            wrapper.appendChild(btnContainer);

            return { domNodes: [wrapper] };
        },
        eventClick: function (info) {
            openModal('edit', info.event);
        }
    });

    calendar.render();

    // Manejar el envío del formulario
    document.getElementById('eventForm').addEventListener('submit', function (e) {
        e.preventDefault();

        var title = document.getElementById('eventTitle').value;
        var startDate = document.getElementById('eventStart').value;
        var duration = parseInt(document.getElementById('eventDuration').value);
        var color = document.getElementById('eventColor').value;

        var endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1); 

        if (window.currentAction === 'add') {
            calendar.addEvent({
                title: title,
                start: startDate,
                end: endDate.toISOString().split('T')[0],
                allDay: true,
                backgroundColor: color,
                borderColor: color,
                textColor: '#ffffff'
            });
        } else if (window.currentAction === 'edit') {
            window.currentEvent.setProp('backgroundColor', color);
            window.currentEvent.setProp('borderColor', color);
            window.currentEvent.setStart(startDate);
            window.currentEvent.setEnd(endDate.toISOString().split('T')[0]);
            window.currentEvent.setProp('title', title); 
        }

        closeModal();
    });

    // Calcular duración cuando cambian las fechas
    document.getElementById('eventEnd').addEventListener('change', calcularDuracion);
    document.getElementById('eventStart').addEventListener('change', calcularDuracion);

    function calcularDuracion() {
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;

        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            document.getElementById('eventDuration').value = diffDays;
        }
    }
});


function openModal(action, data) {
    var modal = document.getElementById('eventModal');
    var overlay = document.getElementById('modalOverlay');

    if (action === 'add') {
        document.getElementById('modalTitle').textContent = 'Agregar Evento al Calendario';
        document.getElementById('eventStart').value = data;
        document.getElementById('eventEnd').value = data;
        document.getElementById('eventDuration').value = 1;
        document.getElementById('eventColor').value = '#3788d8';
    } else if (action === 'edit') {
        document.getElementById('modalTitle').textContent = 'Editar Evento';
        document.getElementById('eventTitle').value = data.title;
        document.getElementById('eventStart').value = data.startStr.split('T')[0];
        document.getElementById('eventEnd').value = data.endStr?.split('T')[0] || '';
        document.getElementById('eventColor').value = data.backgroundColor || '#3788d8';

        // Calcular duración automática al abrir para edición
        const start = new Date(data.startStr);
        const end = new Date(data.endStr);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('eventDuration').value = duration;
    }

    window.currentAction = action;
    window.currentEvent = data;

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeModal() {
    var modal = document.getElementById('eventModal');
    var overlay = document.getElementById('modalOverlay');
    var form = document.getElementById('eventForm');

    modal.style.display = 'none';
    overlay.style.display = 'none';
    form.reset();
}