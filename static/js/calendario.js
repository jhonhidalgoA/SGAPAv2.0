document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        editable: true,
        selectable: true,
        events: [],
        dateClick: function (info) {
            openModal('add', info.dateStr); 
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
        endDate.setDate(endDate.getDate() + duration);

        if (window.currentAction === 'add') {
            // Agregar evento
            calendar.addEvent({
                title: title,
                start: startDate,
                end: endDate.toISOString().split('T')[0],
                allDay: true,
                backgroundColor: color, // Color de fondo
                borderColor: color,     // Color del borde
                textColor: '#ffffff'    // Color del texto (blanco por defecto)
            });
        } else if (window.currentAction === 'edit') {
            // Editar evento
            window.currentEvent.setProp('title', title);
            window.currentEvent.setStart(startDate);
            window.currentEvent.setEnd(endDate.toISOString().split('T')[0]);
            window.currentEvent.setProp('backgroundColor', color); // Actualizar color
            window.currentEvent.setProp('borderColor', color);     // Actualizar color
        }

        closeModal();
    });
});

// Funciones para manejar la ventana modal
function openModal(action, data) {
    var modal = document.getElementById('eventModal');
    var overlay = document.getElementById('modalOverlay');
    var form = document.getElementById('eventForm');

    if (action === 'add') {
        document.getElementById('modalTitle').textContent = 'Agregar Evento al Calendario';
        document.getElementById('eventStart').value = data; // Fecha seleccionada
        document.getElementById('eventColor').value = '#3788d8'; // Color predeterminado
    } else if (action === 'edit') {
        document.getElementById('modalTitle').textContent = 'Editar Evento';
        document.getElementById('eventTitle').value = data.title;
        document.getElementById('eventStart').value = data.startStr.split('T')[0];
        document.getElementById('eventDuration').value = Math.ceil(
            (new Date(data.endStr) - new Date(data.startStr)) / (1000 * 60 * 60 * 24)
        );
        document.getElementById('eventColor').value = data.backgroundColor || '#3788d8'; // Color actual
    }

    window.currentAction = action; // Guardar la acción actual (add/edit)
    window.currentEvent = data;   // Guardar el evento actual (para editar)

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeModal() {
    var modal = document.getElementById('eventModal');
    var overlay = document.getElementById('modalOverlay');
    var form = document.getElementById('eventForm');

    modal.style.display = 'none';
    overlay.style.display = 'none';
    form.reset(); // Limpiar el formulario
}