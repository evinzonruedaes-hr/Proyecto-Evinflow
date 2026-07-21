/*
    proyectos.js
    ------------
    Lógica del módulo de Proyectos. Sigue la misma organización que
    clientes.js (datos, renderizado, búsqueda, eventos, punto de entrada),
    pero con sus propias variables y funciones pensadas para proyectos.

    Todo se guarda en un arreglo de JavaScript (en memoria, se pierde al
    recargar la página). Los puntos marcados con "FUTURO: Firebase" son
    los únicos que habría que tocar más adelante para conectar Firestore.
*/


/* =========================================================
   1. DATOS: el arreglo que hace de "base de datos" temporal
   ========================================================= */

// FUTURO: Firebase — este arreglo se reemplazará por los documentos
// que traigas de la colección "proyectos" en Firestore.
let proyectos = [
    {
        id: "proyecto1",
        nombre: "Rediseño de identidad visual",
        clienteId: "cliente1",
        clienteNombre: "Grupo Empresarial SAS",
        descripcion: "Renovación completa del logo y manual de marca.",
        presupuesto: 2500000,
        fechaEntrega: "2026-05-25",
        estado: "pendiente",
        prioridad: "alta"
    },
    {
        id: "proyecto2",
        nombre: "Plataforma de e-commerce",
        clienteId: "cliente2",
        clienteNombre: "Constructora del Valle",
        descripcion: "Tienda en línea para venta de materiales.",
        presupuesto: 6800000,
        fechaEntrega: "2026-06-02",
        estado: "en_proceso",
        prioridad: "media"
    },
    {
        id: "proyecto3",
        nombre: "Sistema de gestión interna",
        clienteId: "cliente3",
        clienteNombre: "María Fernanda López",
        descripcion: "Panel para organizar pedidos y facturación.",
        presupuesto: 3200000,
        fechaEntrega: "2026-06-18",
        estado: "finalizado",
        prioridad: "baja"
    }
];

// Guarda el id del proyecto que se está editando. Mientras esté en null,
// el formulario funciona en modo "crear". Cuando tiene un id, funciona
// en modo "editar".
let proyectoEditandoId = null;


/* =========================================================
   2. FUNCIONES DE FORMATO (para mostrar los datos "bonitos")
   ========================================================= */

// Convierte una fecha ISO ("2026-05-25") a un texto más legible.
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO + "T00:00:00"); // evita problemas de zona horaria
    return fecha.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Convierte un número (2500000) a texto con formato de moneda ($2.500.000).
function formatearPresupuesto(monto) {
    return "$" + monto.toLocaleString("es-CO");
}

// El valor "en_proceso" (con guion bajo) no coincide con la clase CSS
// ".en-proceso" (con guion medio). Esta función arregla esa diferencia.
function obtenerClaseEstado(estado) {
    return estado === "en_proceso" ? "en-proceso" : estado;
}

// Traduce el valor guardado ("en_proceso") al texto que ve el usuario
// ("En proceso").
function obtenerTextoEstado(estado) {
    if (estado === "pendiente") return "Pendiente";
    if (estado === "en_proceso") return "En proceso";
    if (estado === "finalizado") return "Finalizado";
    return estado;
}

function obtenerTextoPrioridad(prioridad) {
    if (prioridad === "alta") return "Alta";
    if (prioridad === "media") return "Media";
    if (prioridad === "baja") return "Baja";
    return prioridad;
}


/* =========================================================
   3. DIBUJAR LA TABLA a partir del arreglo "proyectos"
   ========================================================= */

// El parámetro "listaProyectos" es OPCIONAL. Si se llama a la función sin
// nada, dibuja el arreglo completo "proyectos". Si se le pasa un arreglo
// distinto (por ejemplo, resultados de una búsqueda), dibuja ESE arreglo.
function renderizarProyectos(listaProyectos) {
    const lista = listaProyectos || proyectos;
    const tbody = document.getElementById("tablaProyectosBody");

    tbody.innerHTML = "";

    lista.forEach(function (proyecto) {
        const fila = document.createElement("tr");
        fila.setAttribute("data-estado", proyecto.estado);

        fila.innerHTML = `
            <td>${proyecto.nombre}</td>
            <td>${proyecto.clienteNombre}</td>
            <td>${formatearPresupuesto(proyecto.presupuesto)}</td>
            <td>${formatearFecha(proyecto.fechaEntrega)}</td>
            <td><span class="etiqueta-estado ${obtenerClaseEstado(proyecto.estado)}">${obtenerTextoEstado(proyecto.estado)}</span></td>
            <td><span class="etiqueta-prioridad ${proyecto.prioridad}">${obtenerTextoPrioridad(proyecto.prioridad)}</span></td>
            <td class="celda-acciones">
                <button class="btn-icono btn-editar" data-id="${proyecto.id}">Editar</button>
                <button class="btn-icono btn-eliminar" data-id="${proyecto.id}">Eliminar</button>
            </td>
        `;

        tbody.appendChild(fila);
    });
}


/* =========================================================
   4. BUSCAR PROYECTOS (en tiempo real)
   ========================================================= */

// Busca coincidencias en el nombre del proyecto o el nombre del cliente,
// sin importar mayúsculas/minúsculas.
function filtrarProyectos(texto) {
    const textoBusqueda = texto.toLowerCase().trim();

    if (textoBusqueda === "") {
        return proyectos;
    }

    return proyectos.filter(function (proyecto) {
        const nombreCoincide = proyecto.nombre.toLowerCase().includes(textoBusqueda);
        const clienteCoincide = proyecto.clienteNombre.toLowerCase().includes(textoBusqueda);

        return nombreCoincide || clienteCoincide;
    });
}

// Recibe una lista de proyectos y un estado, y devuelve solo los que
// coinciden con ese estado. Si el estado es "todos", devuelve la lista
// completa sin filtrar nada.
function filtrarPorEstado(listaProyectos, estado) {
    if (estado === "todos") {
        return listaProyectos;
    }

    return listaProyectos.filter(function (proyecto) {
        return proyecto.estado === estado;
    });
}

// Muestra un mensaje distinto según si no hay resultados de una búsqueda,
// o si simplemente no hay ningún proyecto creado todavía.
function actualizarMensajeVacioProyectos(listaResultados, hayTextoBuscado) {
    const mensaje = document.getElementById("mensajeSinProyectos");

    if (listaResultados.length === 0) {
        if (hayTextoBuscado) {
            mensaje.textContent = "No se encontraron proyectos que coincidan con tu búsqueda.";
        } else {
            mensaje.textContent = "Aún no tienes proyectos registrados. Usa el botón \"+ Nuevo proyecto\" para agregar el primero.";
        }
        mensaje.classList.remove("oculto");
    } else {
        mensaje.classList.add("oculto");
    }
}

// Vuelve a dibujar la tabla RESPETANDO tanto el texto del buscador como
// el estado elegido en el <select>, al mismo tiempo. Se usa después de
// crear, editar o eliminar un proyecto, y también cuando el usuario
// escribe en el buscador o cambia el filtro de estado.
function actualizarVistaProyectos() {
    const inputBuscador = document.getElementById("buscadorProyectos");
    const selectEstado = document.getElementById("filtroEstado");

    // Primero filtramos por texto, y sobre ESE resultado filtramos
    // también por estado. Así los dos filtros trabajan juntos.
    let resultados = filtrarProyectos(inputBuscador.value);
    resultados = filtrarPorEstado(resultados, selectEstado.value);

    renderizarProyectos(resultados);

    const hayFiltroActivo =
        inputBuscador.value.trim() !== "" || selectEstado.value !== "todos";

    actualizarMensajeVacioProyectos(resultados, hayFiltroActivo);
}

function conectarBusquedaProyectos() {
    const inputBuscador = document.getElementById("buscadorProyectos");

    inputBuscador.addEventListener("input", function () {
        actualizarVistaProyectos();
    });
}

// Conecta el filtro de estado. Usamos el evento "change", que se dispara
// cuando el usuario elige una opción distinta en el <select>.
function conectarFiltroEstadoProyectos() {
    const selectEstado = document.getElementById("filtroEstado");

    selectEstado.addEventListener("change", function () {
        actualizarVistaProyectos();
    });
}


/* =========================================================
   5. ABRIR / CERRAR / GUARDAR — eventos del formulario
   ========================================================= */

function conectarEventosProyecto() {
    const overlay = document.getElementById("formularioProyecto");
    const btnCancelar = document.getElementById("btnCancelarProyecto");
    const formulario = document.getElementById("formProyecto");
    const titulo = document.getElementById("tituloFormularioProyecto");
    const tbody = document.getElementById("tablaProyectosBody");

    // Abrir el formulario en modo "crear"
    const btnNuevo = document.getElementById("btnNuevoProyecto");
    btnNuevo.addEventListener("click", function () {
        proyectoEditandoId = null;
        titulo.textContent = "Nuevo proyecto";
        formulario.reset();
        overlay.classList.remove("oculto");
    });

    // Editar o eliminar un proyecto. Los botones se recrean cada vez que
    // se redibuja la tabla, así que usamos UN SOLO listener en el
    // <tbody> (delegación de eventos) en vez de uno por botón.
    tbody.addEventListener("click", function (evento) {
        const boton = evento.target;

        if (boton.classList.contains("btn-editar")) {
            abrirFormularioParaEditar(boton.dataset.id);
        }

        if (boton.classList.contains("btn-eliminar")) {
            eliminarProyecto(boton.dataset.id);
        }
    });

    function abrirFormularioParaEditar(idProyecto) {
        const proyecto = proyectos.find(function (p) {
            return p.id === idProyecto;
        });

        if (!proyecto) {
            return;
        }

        proyectoEditandoId = proyecto.id;
        titulo.textContent = "Editar proyecto";

        document.getElementById("nombreProyecto").value = proyecto.nombre;
        document.getElementById("clienteProyecto").value = proyecto.clienteId;
        document.getElementById("descripcionProyecto").value = proyecto.descripcion;
        document.getElementById("presupuestoProyecto").value = proyecto.presupuesto;
        document.getElementById("fechaEntregaProyecto").value = proyecto.fechaEntrega;
        document.getElementById("estadoProyecto").value = proyecto.estado;
        document.getElementById("prioridadProyecto").value = proyecto.prioridad;

        overlay.classList.remove("oculto");
    }

    function eliminarProyecto(idProyecto) {
        const proyecto = proyectos.find(function (p) {
            return p.id === idProyecto;
        });

        if (!proyecto) {
            return;
        }

        const confirmado = confirm(
            "¿Seguro que quieres eliminar el proyecto \"" + proyecto.nombre + "\"?"
        );

        if (!confirmado) {
            return;
        }

        // FUTURO: Firebase — en vez de esto, deleteDoc(doc(db, "proyectos", idProyecto)).
        proyectos = proyectos.filter(function (p) {
            return p.id !== idProyecto;
        });

        if (proyectoEditandoId === idProyecto) {
            proyectoEditandoId = null;
            overlay.classList.add("oculto");
        }

        actualizarVistaProyectos();
    }

    // Cerrar el formulario al presionar "Cancelar"
    btnCancelar.addEventListener("click", function () {
        proyectoEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
    });

    // Guardar el formulario: crea un proyecto nuevo, o actualiza uno
    // existente si estamos en modo edición.
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault(); // evita que la página se recargue

        const selectCliente = document.getElementById("clienteProyecto");
        // .text trae lo que el usuario VE en el <select> (el nombre del
        // cliente), no solo el value (que es su id).
        const nombreClienteElegido = selectCliente.options[selectCliente.selectedIndex].text;

        const datosFormulario = {
            nombre: document.getElementById("nombreProyecto").value,
            clienteId: selectCliente.value,
            clienteNombre: nombreClienteElegido,
            descripcion: document.getElementById("descripcionProyecto").value,
            presupuesto: Number(document.getElementById("presupuestoProyecto").value),
            fechaEntrega: document.getElementById("fechaEntregaProyecto").value,
            estado: document.getElementById("estadoProyecto").value,
            prioridad: document.getElementById("prioridadProyecto").value
        };

        if (proyectoEditandoId) {
            // MODO EDITAR: buscamos el proyecto y actualizamos sus datos,
            // conservando su id original.
            // FUTURO: Firebase — updateDoc(doc(db, "proyectos", id), datosFormulario).
            const proyecto = proyectos.find(function (p) {
                return p.id === proyectoEditandoId;
            });

            proyecto.nombre = datosFormulario.nombre;
            proyecto.clienteId = datosFormulario.clienteId;
            proyecto.clienteNombre = datosFormulario.clienteNombre;
            proyecto.descripcion = datosFormulario.descripcion;
            proyecto.presupuesto = datosFormulario.presupuesto;
            proyecto.fechaEntrega = datosFormulario.fechaEntrega;
            proyecto.estado = datosFormulario.estado;
            proyecto.prioridad = datosFormulario.prioridad;

        } else {
            // MODO CREAR: agregamos un proyecto nuevo al arreglo.
            // FUTURO: Firebase — addDoc(collection(db, "proyectos"), nuevoProyecto).
            const nuevoProyecto = Object.assign(
                { id: "proyecto" + Date.now() }, // id temporal único mientras no hay Firebase
                datosFormulario
            );

            proyectos.push(nuevoProyecto);
        }

        actualizarVistaProyectos();

        proyectoEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
    });
}


/* =========================================================
   6. PUNTO DE ENTRADA: qué se ejecuta al cargar la página
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    renderizarProyectos();
    conectarEventosProyecto();
    conectarBusquedaProyectos();
    conectarFiltroEstadoProyectos();
});
