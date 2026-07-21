/*
    tareas.js
    ---------
    Lógica del módulo de Tareas. Sigue la misma organización que
    clientes.js, proyectos.js y presupuestos.js (datos, funciones
    auxiliares, renderizado, búsqueda, eventos, punto de entrada).

    Todo se guarda en un arreglo de JavaScript (en memoria). Los puntos
    marcados con "FUTURO: Firebase" son los únicos que habría que tocar
    más adelante para conectar Firestore, sin cambiar el resto del código.
*/


/* =========================================================
   1. DATOS: el arreglo que hace de "base de datos" temporal
   ========================================================= */

// FUTURO: Firebase — este arreglo se reemplazará por el resultado de
// getDocs(collection(db, "proyectos")). Es la ÚNICA lista de proyectos
// del módulo: ningún otro lugar del código debe copiar el nombre de un
// proyecto — siempre se consulta aquí, a través de obtenerProyectoPorId().
const proyectosDisponibles = [
    { id: "proyecto1", nombre: "Rediseño de identidad visual" },
    { id: "proyecto2", nombre: "Plataforma de e-commerce" },
    { id: "proyecto3", nombre: "Aplicación móvil EvinFlow" }
];

// FUTURO: Firebase — este arreglo se reemplazará por los documentos que
// traigas de la colección "tareas" en Firestore.
//
// Cada tarea guarda SOLO "proyectoId" (una referencia), no el nombre del
// proyecto — eso se consulta con obtenerProyectoPorId() cuando se
// necesita mostrar.
let tareas = [
    {
        id: "tarea1",
        descripcion: "Reunión con el cliente",
        proyectoId: "proyecto1",
        fechaLimite: "2026-05-16",
        prioridad: "alta",
        estado: "pendiente"
    },
    {
        id: "tarea2",
        descripcion: "Enviar propuesta final",
        proyectoId: "proyecto2",
        fechaLimite: "2026-05-17",
        prioridad: "media",
        estado: "pendiente"
    },
    {
        id: "tarea3",
        descripcion: "Diseño de interfaz",
        proyectoId: "proyecto3",
        fechaLimite: "2026-05-10",
        prioridad: "baja",
        estado: "completada"
    }
];

// Guarda el id de la tarea que se está editando. Mientras esté en null,
// el formulario funciona en modo "crear".
let tareaEditandoId = null;


/* =========================================================
   2. FUNCIONES AUXILIARES (cálculos y formato)
   ========================================================= */

// ÚNICO lugar del código donde se busca la información de un proyecto.
// FUTURO: Firebase — en vez de buscar en el arreglo, esto sería
// getDoc(doc(db, "proyectos", id)).
function obtenerProyectoPorId(idProyecto) {
    return proyectosDisponibles.find(function (proyecto) {
        return proyecto.id === idProyecto;
    });
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO + "T00:00:00"); // evita problemas de zona horaria
    return fecha.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function obtenerTextoPrioridad(prioridad) {
    if (prioridad === "alta") return "Alta";
    if (prioridad === "media") return "Media";
    if (prioridad === "baja") return "Baja";
    return prioridad;
}

function obtenerTextoEstadoTarea(estado) {
    return estado === "completada" ? "Completada" : "Pendiente";
}


/* =========================================================
   3. RENDERIZADO
   ========================================================= */

// Genera las <option> del <select> de proyecto A PARTIR de
// proyectosDisponibles, en vez de tenerlas escritas a mano en el HTML.
function cargarOpcionesProyecto() {
    const selectProyecto = document.getElementById("proyectoTarea");

    proyectosDisponibles.forEach(function (proyecto) {
        const opcion = document.createElement("option");
        opcion.value = proyecto.id;
        opcion.textContent = proyecto.nombre;
        selectProyecto.appendChild(opcion);
    });
}

// El parámetro "listaTareas" es OPCIONAL. Si se llama sin nada, dibuja el
// arreglo completo "tareas". Si se le pasa un arreglo distinto (por
// ejemplo, resultados de una búsqueda), dibuja ESE arreglo.
function renderizarTareas(listaTareas) {
    const lista = listaTareas || tareas;
    const tbody = document.getElementById("tablaTareasBody");

    tbody.innerHTML = "";

    lista.forEach(function (tarea) {
        const fila = document.createElement("tr");
        fila.setAttribute("data-estado", tarea.estado);

        // Si la tarea está completada, agregamos la clase que tacha el
        // texto (definida en tareas.css: "tr.completada td").
        if (tarea.estado === "completada") {
            fila.classList.add("completada");
        }

        // Consultamos el proyecto por id, en vez de leer un nombre que
        // estuviera copiado dentro de la tarea.
        const proyecto = obtenerProyectoPorId(tarea.proyectoId);
        const nombreProyecto = proyecto ? proyecto.nombre : "Proyecto eliminado";

        const marcado = tarea.estado === "completada" ? "checked" : "";

        fila.innerHTML = `
            <td>
                <input type="checkbox" class="check-tarea" data-id="${tarea.id}" ${marcado}>
            </td>
            <td>${tarea.descripcion}</td>
            <td>${nombreProyecto}</td>
            <td>${formatearFecha(tarea.fechaLimite)}</td>
            <td><span class="etiqueta-prioridad ${tarea.prioridad}">${obtenerTextoPrioridad(tarea.prioridad)}</span></td>
            <td class="celda-acciones">
                <button class="btn-icono btn-editar" data-id="${tarea.id}">Editar</button>
                <button class="btn-icono btn-eliminar" data-id="${tarea.id}">Eliminar</button>
            </td>
        `;

        tbody.appendChild(fila);
    });
}


/* =========================================================
   4. BUSCAR TAREAS (en tiempo real)
   ========================================================= */

// Busca coincidencias en la descripción, el nombre del proyecto, o el
// texto del estado (por ejemplo, escribir "completada" también debe
// encontrar resultados).
function filtrarTareas(texto) {
    const textoBusqueda = texto.toLowerCase().trim();

    if (textoBusqueda === "") {
        return tareas;
    }

    return tareas.filter(function (tarea) {
        const proyecto = obtenerProyectoPorId(tarea.proyectoId);
        const nombreProyecto = proyecto ? proyecto.nombre : "";

        const descripcionCoincide = tarea.descripcion.toLowerCase().includes(textoBusqueda);
        const proyectoCoincide = nombreProyecto.toLowerCase().includes(textoBusqueda);
        const estadoCoincide = obtenerTextoEstadoTarea(tarea.estado).toLowerCase().includes(textoBusqueda);

        return descripcionCoincide || proyectoCoincide || estadoCoincide;
    });
}

// Reduce una lista de tareas a un solo estado, o la deja igual si el
// valor elegido es "todas" (así se llama la opción neutra en este select,
// a diferencia de "todos" que usan Proyectos y Presupuestos).
function filtrarPorEstadoTarea(listaTareas, estado) {
    if (estado === "todas") {
        return listaTareas;
    }

    return listaTareas.filter(function (tarea) {
        return tarea.estado === estado;
    });
}

function actualizarMensajeVacioTareas(listaResultados, hayFiltroActivo) {
    const mensaje = document.getElementById("mensajeSinTareas");

    if (listaResultados.length === 0) {
        if (hayFiltroActivo) {
            mensaje.textContent = "No se encontraron tareas que coincidan con tu búsqueda.";
        } else {
            mensaje.textContent = "Aún no tienes tareas registradas. Usa el botón \"+ Nueva tarea\" para agregar la primera.";
        }
        mensaje.classList.remove("oculto");
    } else {
        mensaje.classList.add("oculto");
    }
}

// Combina el texto del buscador y el <select> de estado. Se usa después
// de crear, editar, eliminar, marcar/desmarcar, buscar o cambiar el
// filtro — para que ninguna acción pierda el filtro activo.
function actualizarVistaTareas() {
    const inputBuscador = document.getElementById("buscadorTareas");
    const selectEstado = document.getElementById("filtroEstadoTarea");

    let resultados = filtrarTareas(inputBuscador.value);
    resultados = filtrarPorEstadoTarea(resultados, selectEstado.value);

    renderizarTareas(resultados);

    const hayFiltroActivo =
        inputBuscador.value.trim() !== "" || selectEstado.value !== "todas";

    actualizarMensajeVacioTareas(resultados, hayFiltroActivo);
}

function conectarBusquedaTareas() {
    const inputBuscador = document.getElementById("buscadorTareas");
    inputBuscador.addEventListener("input", actualizarVistaTareas);
}

function conectarFiltroEstadoTareas() {
    const selectEstado = document.getElementById("filtroEstadoTarea");
    selectEstado.addEventListener("change", actualizarVistaTareas);
}


/* =========================================================
   5. EVENTOS (CRUD) — abrir, cerrar, guardar, completar
   ========================================================= */

function conectarEventosTarea() {
    const overlay = document.getElementById("formularioTarea");
    const btnCancelar = document.getElementById("btnCancelarTarea");
    const formulario = document.getElementById("formTarea");
    const titulo = document.getElementById("tituloFormularioTarea");
    const tbody = document.getElementById("tablaTareasBody");

    // ---- Abrir el formulario en modo "crear" ----
    const btnNueva = document.getElementById("btnNuevaTarea");
    btnNueva.addEventListener("click", function () {
        tareaEditandoId = null;
        titulo.textContent = "Nueva tarea";
        formulario.reset();
        overlay.classList.remove("oculto");
    });

    // ---- Editar o eliminar (delegación de eventos de click en el <tbody>) ----
    tbody.addEventListener("click", function (evento) {
        const boton = evento.target;

        if (boton.classList.contains("btn-editar")) {
            abrirFormularioParaEditar(boton.dataset.id);
        }

        if (boton.classList.contains("btn-eliminar")) {
            eliminarTarea(boton.dataset.id);
        }
    });

    // ---- Marcar/desmarcar como completada (delegación de "change") ----
    // Es un evento distinto a "click" porque el checkbox usa "change"
    // (se dispara cuando el usuario lo marca o desmarca).
    tbody.addEventListener("change", function (evento) {
        const casilla = evento.target;

        if (casilla.classList.contains("check-tarea")) {
            alternarEstadoTarea(casilla.dataset.id);
        }
    });

    function abrirFormularioParaEditar(idTarea) {
        const tarea = tareas.find(function (t) {
            return t.id === idTarea;
        });

        if (!tarea) {
            return;
        }

        tareaEditandoId = tarea.id;
        titulo.textContent = "Editar tarea";

        document.getElementById("descripcionTarea").value = tarea.descripcion;
        document.getElementById("proyectoTarea").value = tarea.proyectoId;
        document.getElementById("fechaLimiteTarea").value = tarea.fechaLimite;
        document.getElementById("prioridadTarea").value = tarea.prioridad;

        overlay.classList.remove("oculto");
    }

    function eliminarTarea(idTarea) {
        const tarea = tareas.find(function (t) {
            return t.id === idTarea;
        });

        if (!tarea) {
            return;
        }

        const confirmado = confirm(
            "¿Seguro que quieres eliminar la tarea \"" + tarea.descripcion + "\"?"
        );

        if (!confirmado) {
            return;
        }

        // FUTURO: Firebase — deleteDoc(doc(db, "tareas", idTarea)).
        tareas = tareas.filter(function (t) {
            return t.id !== idTarea;
        });

        if (tareaEditandoId === idTarea) {
            tareaEditandoId = null;
            overlay.classList.add("oculto");
        }

        actualizarVistaTareas();
    }

    function alternarEstadoTarea(idTarea) {
        const tarea = tareas.find(function (t) {
            return t.id === idTarea;
        });

        if (!tarea) {
            return;
        }

        // FUTURO: Firebase — updateDoc(doc(db, "tareas", idTarea), { estado: nuevoEstado }).
        tarea.estado = tarea.estado === "completada" ? "pendiente" : "completada";

        actualizarVistaTareas();
    }

    // ---- Cerrar el formulario al presionar "Cancelar" ----
    btnCancelar.addEventListener("click", function () {
        tareaEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
    });

    // ---- Guardar (crear o actualizar) ----
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const datosFormulario = {
            descripcion: document.getElementById("descripcionTarea").value,
            proyectoId: document.getElementById("proyectoTarea").value,
            fechaLimite: document.getElementById("fechaLimiteTarea").value,
            prioridad: document.getElementById("prioridadTarea").value
        };

        if (tareaEditandoId) {
            // MODO EDITAR: el estado (pendiente/completada) NO se toca
            // aquí — solo se cambia con el checkbox de la tabla.
            // FUTURO: Firebase — updateDoc(doc(db, "tareas", id), datosFormulario).
            const tarea = tareas.find(function (t) {
                return t.id === tareaEditandoId;
            });

            Object.assign(tarea, datosFormulario);

        } else {
            // MODO CREAR: toda tarea nueva empieza como "pendiente".
            // FUTURO: Firebase — addDoc(collection(db, "tareas"), nuevaTarea).
            const nuevaTarea = Object.assign(
                { id: "tarea" + Date.now(), estado: "pendiente" },
                datosFormulario
            );

            tareas.push(nuevaTarea);
        }

        actualizarVistaTareas();

        tareaEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
    });
}


/* =========================================================
   6. PUNTO DE ENTRADA: qué se ejecuta al cargar la página
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    cargarOpcionesProyecto();
    renderizarTareas();
    conectarEventosTarea();
    conectarBusquedaTareas();
    conectarFiltroEstadoTareas();
});
