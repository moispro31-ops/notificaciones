let recordatorios = JSON.parse(localStorage.getItem('recordatorios_movil')) || [];

// Comprobar estado de permisos al cargar
window.addEventListener('DOMContentLoaded', () => {
    if (Notification.permission === "granted") {
        actualizarBotonPermiso(true);
    }
});

function solicitarPermisoNotificaciones() {
    if (!("Notification" in window)) {
        alert("Tu navegador móvil no soporta notificaciones nativas.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            actualizarBotonPermiso(true);
            // Lanzamos una notificación de prueba inmediata para asegurar que funciona
            new Notification("¡SmartAlarm Activada!", {
                body: "Recibirás tus recordatorios aquí correctamente.",
                icon: "https://cdn-icons-png.flaticon.com/512/3236/3236940.png"
            });
        } else {
            alert("Debes permitir las notificaciones en la configuración de tu navegador para recibir los avisos.");
        }
    });
}

function actualizarBotonPermiso(activo) {
    const btn = document.getElementById('btnPermiso');
    if (activo) {
        btn.classList.add('activo');
        btn.innerHTML = '<i class="fa-solid fa-bell-slash"></i> Activo';
    }
}

function agregarRecordatorio(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value;
    const fechaHora = document.getElementById('fechaHora').value;
    const prioridad = document.getElementById('prioridad').value;

    const nuevo = {
        id: Date.now(),
        titulo,
        fechaHora,
        prioridad,
        sonado: false
    };

    recordatorios.push(nuevo);
    guardarYRenderizar();
    document.getElementById('formRecordatorio').reset();
}

function eliminarRecordatorio(id) {
    recordatorios = recordatorios.filter(r => r.id !== id);
    guardarYRenderizar();
}

function guardarYRenderizar() {
    localStorage.setItem('recordatorios_movil', JSON.stringify(recordatorios));
    renderizarRecordatorios();
}

function renderizarRecordatorios() {
    const contenedor = document.getElementById('listaRecordatorios');
    const contador = document.getElementById('contadorPendientes');
    
    contador.textContent = recordatorios.filter(r => !r.sonado).length;

    if (recordatorios.length === 0) {
        contenedor.innerHTML = `<div class="vacio">No hay recordatorios pendientes.</div>`;
        return;
    }

    contenedor.innerHTML = '';
    recordatorios.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

    recordatorios.forEach(rec => {
        const fechaFormatted = new Date(rec.fechaHora).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const esUrgente = rec.prioridad === 'importante';
        
        const card = document.createElement('div');
        card.className = `item-recordatorio ${esUrgente ? 'urgente' : ''}`;

        card.innerHTML = `
            <div class="item-info">
                <h3>
                    ${rec.titulo} 
                    ${esUrgente ? '<span class="tag-urgente">Urgente</span>' : ''}
                </h3>
                <p><i class="fa-regular fa-clock"></i> ${fechaFormatted}</p>
            </div>
            <button class="btn-borrar" onclick="eliminarRecordatorio(${rec.id})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        contenedor.appendChild(card);
    });
}

// Bucle de verificación de alarmas optimizado para móviles
setInterval(() => {
    const ahora = new Date();
    
    recordatorios.forEach(rec => {
        if (rec.sonado) return;

        const fechaRec = new Date(rec.fechaHora);
        if (ahora >= fechaRec) {
            rec.sonado = true;
            guardarYRenderizar();
            dispararAlarmaMovil(rec.titulo);
        }
    });
}, 1000);

function dispararAlarmaMovil(titulo) {
    // 1. Sonido por Web Audio / Elemento de audio
    const audio = document.getElementById('audioAlarma');
    audio.play().catch(() => {});

    // 2. Notificación flotante nativa en el celular con vibración integrada
    if (Notification.permission === "granted") {
        try {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification("¡Alarma de Recordatorio! ⏰", {
                    body: titulo,
                    icon: "https://cdn-icons-png.flaticon.com/512/3236/3236940.png",
                    vibrate: [300, 100, 300, 100, 300],
                    tag: 'alarma-movil',
                    renotify: true
                });
            }).catch(() => {
                new Notification("¡Alarma de Recordatorio! ⏰", {
                    body: titulo,
                    icon: "https://cdn-icons-png.flaticon.com/512/3236/3236940.png"
                });
            });
        } catch (e) {
            new Notification("¡Alarma de Recordatorio! ⏰", { body: titulo });
        }
    }
}