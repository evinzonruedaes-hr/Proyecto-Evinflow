/*
    presupuestos.js
    ---------------
    Lógica del módulo de Presupuestos. Sigue la misma organización que
    clientes.js y proyectos.js (datos, funciones auxiliares, renderizado,
    búsqueda, eventos, punto de entrada).

    Todo se guarda en un arreglo de JavaScript (en memoria). Los puntos
    marcados con "FUTURO: Firebase" son los únicos que habría que tocar
    más adelante para conectar Firestore, sin cambiar el resto del código.
*/


/* =========================================================
   1. DATOS: el arreglo que hace de "base de datos" temporal
   ========================================================= */

// FUTURO: Firebase — este arreglo se reemplazará por el resultado de
// getDocs(collection(db, "proyectos")). Por ahora es la ÚNICA lista de
// proyectos del sistema: cada objeto tiene la misma forma que tendría un
// documento de Firestore (un "id" y sus datos). Ningún otro lugar del
// código debe copiar el nombre de un proyecto o de su cliente — siempre
// se consulta aquí, a través de obtenerProyectoPorId().
const proyectosDisponibles = [
    { id: "proyecto1", nombre: "Rediseño de identidad visual", clienteNombre: "Grupo Empresarial SAS" },
    { id: "proyecto2", nombre: "Plataforma de e-commerce", clienteNombre: "Constructora del Valle" },
    { id: "proyecto3", nombre: "Sistema de gestión interna", clienteNombre: "María Fernanda López" }
];

// FUTURO: Firebase — este arreglo se reemplazará por los documentos que
// traigas de la colección "presupuestos" en Firestore.
//
// Cada presupuesto guarda SOLO "proyectoId" (una referencia), no el
// nombre del proyecto ni del cliente — esos se consultan cuando se
// necesitan, con obtenerProyectoPorId(). Así la información del proyecto
// vive en un único lugar (proyectosDisponibles).
//
// Nota sobre el presupuesto #3: en la tabla original decía "Vencido",
// pero con la regla nueva (deuda > 0 -> Pendiente, deuda = 0 -> Pagado)
// ese estado ya no se asigna automáticamente. Lo dejamos como "pendiente"
// para que sea consistente con el resto del sistema.
let presupuestos = [
    {
        id: "presupuesto1",
        proyectoId: "proyecto1",
        monto: 2500000,
        abono: 1500000,
        deuda: 1000000,
        estado: "pendiente",
        fechaLimitePago: "2026-05-30",
        notas: ""
    },
    {
        id: "presupuesto2",
        proyectoId: "proyecto2",
        monto: 6800000,
        abono: 6800000,
        deuda: 0,
        estado: "pagado",
        fechaLimitePago: "2026-06-02",
        notas: ""
    },
    {
        id: "presupuesto3",
        proyectoId: "proyecto3",
        monto: 3200000,
        abono: 0,
        deuda: 3200000,
        estado: "pendiente",
        fechaLimitePago: "2026-04-18",
        notas: ""
    }
];

// Guarda el id del presupuesto que se está editando. Mientras esté en
// null, el formulario funciona en modo "crear".
let presupuestoEditandoId = null;


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

// Las dos reglas automáticas que pediste, en un solo lugar cada una.
function calcularDeuda(monto, abono) {
    return monto - abono;
}

function calcularEstado(deuda) {
    return deuda > 0 ? "pendiente" : "pagado";
}

function formatearMoneda(monto) {
    return "$" + monto.toLocaleString("es-CO");
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO + "T00:00:00"); // evita problemas de zona horaria
    return fecha.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function obtenerTextoEstadoPago(estado) {
    if (estado === "pendiente") return "Pendiente";
    if (estado === "pagado") return "Pagado";
    if (estado === "vencido") return "Vencido";
    return estado;
}


/* =========================================================
   3. DIBUJAR LA TABLA a partir del arreglo "presupuestos"
   ========================================================= */

function renderizarPresupuestos(listaPresupuestos) {
    const lista = listaPresupuestos || presupuestos;
    const tbody = document.getElementById("tablaPresupuestosBody");

    tbody.innerHTML = "";

    lista.forEach(function (presupuesto) {
        const fila = document.createElement("tr");
        fila.setAttribute("data-estado", presupuesto.estado);

        // Consultamos el proyecto (y su cliente) por id, en vez de leer
        // un nombre que estuviera copiado dentro del presupuesto.
        const proyecto = obtenerProyectoPorId(presupuesto.proyectoId);
        const nombreProyecto = proyecto ? proyecto.nombre : "Proyecto eliminado";
        const nombreCliente = proyecto ? proyecto.clienteNombre : "—";

        fila.innerHTML = `
            <td>${nombreCliente}</td>
            <td>${nombreProyecto}</td>
            <td>${formatearMoneda(presupuesto.monto)}</td>
            <td>${formatearMoneda(presupuesto.deuda)}</td>
            <td><span class="etiqueta-pago ${presupuesto.estado}">${obtenerTextoEstadoPago(presupuesto.estado)}</span></td>
            <td>${formatearFecha(presupuesto.fechaLimitePago)}</td>
            <td class="celda-acciones">
                <button class="btn-icono btn-editar" data-id="${presupuesto.id}">Editar</button>
                <button class="btn-icono btn-eliminar" data-id="${presupuesto.id}">Eliminar</button>
            </td>
        `;

        tbody.appendChild(fila);
    });
}

// Genera las <option> del <select> de proyecto A PARTIR de
// proyectosDisponibles, en vez de tenerlas escritas a mano en el HTML.
// Así el nombre de cada proyecto vive en un solo lugar (el arreglo de
// datos), no repetido también en el HTML.
function cargarOpcionesProyecto() {
    const selectProyecto = document.getElementById("proyectoPresupuesto");

    proyectosDisponibles.forEach(function (proyecto) {
        const opcion = document.createElement("option");
        opcion.value = proyecto.id;
        opcion.textContent = proyecto.nombre;
        selectProyecto.appendChild(opcion);
    });
}


/* =========================================================
   4. BUSCAR PRESUPUESTOS (en tiempo real)
   ========================================================= */

// Busca coincidencias en el proyecto, el cliente, o el texto del estado
// (por ejemplo, escribir "pagado" también debe encontrar resultados).
function filtrarPresupuestos(texto) {
    const textoBusqueda = texto.toLowerCase().trim();

    if (textoBusqueda === "") {
        return presupuestos;
    }

    return presupuestos.filter(function (presupuesto) {
        const proyecto = obtenerProyectoPorId(presupuesto.proyectoId);
        const nombreProyecto = proyecto ? proyecto.nombre : "";
        const nombreCliente = proyecto ? proyecto.clienteNombre : "";

        const proyectoCoincide = nombreProyecto.toLowerCase().includes(textoBusqueda);
        const clienteCoincide = nombreCliente.toLowerCase().includes(textoBusqueda);
        const estadoCoincide = obtenerTextoEstadoPago(presupuesto.estado).toLowerCase().includes(textoBusqueda);

        return proyectoCoincide || clienteCoincide || estadoCoincide;
    });
}

// Igual que el filtro por estado de Proyectos: reduce una lista a un solo
// estado, o la deja igual si el valor elegido es "todos".
function filtrarPorEstadoPago(listaPresupuestos, estado) {
    if (estado === "todos") {
        return listaPresupuestos;
    }

    return listaPresupuestos.filter(function (presupuesto) {
        return presupuesto.estado === estado;
    });
}

function actualizarMensajeVacioPresupuestos(listaResultados, hayFiltroActivo) {
    const mensaje = document.getElementById("mensajeSinPresupuestos");

    if (listaResultados.length === 0) {
        if (hayFiltroActivo) {
            mensaje.textContent = "No se encontraron presupuestos que coincidan con tu búsqueda.";
        } else {
            mensaje.textContent = "Aún no tienes presupuestos registrados. Usa el botón \"+ Nuevo presupuesto\" para agregar el primero.";
        }
        mensaje.classList.remove("oculto");
    } else {
        mensaje.classList.add("oculto");
    }
}

// Combina el texto del buscador y el <select> de estado, igual que en
// proyectos.js. Se usa después de crear, editar, eliminar, buscar o
// cambiar el filtro.
function actualizarVistaPresupuestos() {
    const inputBuscador = document.getElementById("buscadorPresupuestos");
    const selectEstado = document.getElementById("filtroEstadoPago");

    let resultados = filtrarPresupuestos(inputBuscador.value);
    resultados = filtrarPorEstadoPago(resultados, selectEstado.value);

    renderizarPresupuestos(resultados);

    const hayFiltroActivo =
        inputBuscador.value.trim() !== "" || selectEstado.value !== "todos";

    actualizarMensajeVacioPresupuestos(resultados, hayFiltroActivo);
}

function conectarBusquedaPresupuestos() {
    const inputBuscador = document.getElementById("buscadorPresupuestos");
    inputBuscador.addEventListener("input", actualizarVistaPresupuestos);
}

function conectarFiltroEstadoPresupuestos() {
    const selectEstado = document.getElementById("filtroEstadoPago");
    selectEstado.addEventListener("change", actualizarVistaPresupuestos);
}


/* =========================================================
   5. EVENTOS (CRUD) — abrir, cerrar, calcular y guardar
   ========================================================= */

function conectarEventosPresupuesto() {
    const overlay = document.getElementById("formularioPresupuesto");
    const btnCancelar = document.getElementById("btnCancelarPresupuesto");
    const formulario = document.getElementById("formPresupuesto");
    const titulo = document.getElementById("tituloFormularioPresupuesto");
    const tbody = document.getElementById("tablaPresupuestosBody");

    const selectProyecto = document.getElementById("proyectoPresupuesto");
    const inputCliente = document.getElementById("clienteAsociado");
    const inputMonto = document.getElementById("montoPresupuesto");
    const inputAbono = document.getElementById("abonoPresupuesto");
    const inputDeuda = document.getElementById("deudaPresupuesto");
    const inputEstado = document.getElementById("estadoPresupuesto");
    const mensajeError = document.getElementById("errorPresupuesto");

    // ---- Autocompletar el cliente al elegir un proyecto ----
    // Consulta la ÚNICA fuente de datos de proyectos (obtenerProyectoPorId),
    // en vez de leer un objeto aparte escrito a mano.
    function actualizarClienteAsociado() {
        const proyecto = obtenerProyectoPorId(selectProyecto.value);
        inputCliente.value = proyecto ? proyecto.clienteNombre : "";
    }

    selectProyecto.addEventListener("change", actualizarClienteAsociado);

    // ---- Recalcular deuda y estado cada vez que cambian monto o abono ----
    function recalcularDeudaYEstado() {
        const monto = Number(inputMonto.value) || 0;
        const abono = Number(inputAbono.value) || 0;

        const deuda = calcularDeuda(monto, abono);

        inputDeuda.value = formatearMoneda(deuda);
        inputEstado.value = obtenerTextoEstadoPago(calcularEstado(deuda));

        return deuda; // lo devolvemos para poder validarlo en el submit
    }

    inputMonto.addEventListener("input", recalcularDeudaYEstado);
    inputAbono.addEventListener("input", recalcularDeudaYEstado);

    // ---- Mostrar / ocultar el mensaje de error ----
    function mostrarError(texto) {
        mensajeError.textContent = texto;
        mensajeError.classList.remove("oculto");
    }

    function ocultarError() {
        mensajeError.classList.add("oculto");
    }

    // ---- Abrir el formulario en modo "crear" ----
    const btnNuevo = document.getElementById("btnNuevoPresupuesto");
    btnNuevo.addEventListener("click", function () {
        presupuestoEditandoId = null;
        titulo.textContent = "Nuevo presupuesto";
        formulario.reset();
        inputCliente.value = "";
        inputDeuda.value = "";
        inputEstado.value = "";
        ocultarError();
        overlay.classList.remove("oculto");
    });

    // ---- Editar o eliminar (delegación de eventos en el <tbody>) ----
    tbody.addEventListener("click", function (evento) {
        const boton = evento.target;

        if (boton.classList.contains("btn-editar")) {
            abrirFormularioParaEditar(boton.dataset.id);
        }

        if (boton.classList.contains("btn-eliminar")) {
            eliminarPresupuesto(boton.dataset.id);
        }
    });

    function abrirFormularioParaEditar(idPresupuesto) {
        const presupuesto = presupuestos.find(function (p) {
            return p.id === idPresupuesto;
        });

        if (!presupuesto) {
            return;
        }

        presupuestoEditandoId = presupuesto.id;
        titulo.textContent = "Editar presupuesto";
        ocultarError();

        selectProyecto.value = presupuesto.proyectoId;
        actualizarClienteAsociado(); // consulta el cliente por el id de proyecto ya elegido
        inputMonto.value = presupuesto.monto;
        inputAbono.value = presupuesto.abono;
        document.getElementById("fechaLimitePago").value = presupuesto.fechaLimitePago;
        document.getElementById("notasPresupuesto").value = presupuesto.notas;

        // Recalculamos para que los campos de solo lectura (deuda/estado)
        // se muestren correctamente al abrir el formulario.
        recalcularDeudaYEstado();

        overlay.classList.remove("oculto");
    }

    function eliminarPresupuesto(idPresupuesto) {
        const presupuesto = presupuestos.find(function (p) {
            return p.id === idPresupuesto;
        });

        if (!presupuesto) {
            return;
        }

        const proyecto = obtenerProyectoPorId(presupuesto.proyectoId);
        const nombreProyecto = proyecto ? proyecto.nombre : "este proyecto";

        const confirmado = confirm(
            "¿Seguro que quieres eliminar el presupuesto de \"" + nombreProyecto + "\"?"
        );

        if (!confirmado) {
            return;
        }

        // FUTURO: Firebase — deleteDoc(doc(db, "presupuestos", idPresupuesto)).
        presupuestos = presupuestos.filter(function (p) {
            return p.id !== idPresupuesto;
        });

        if (presupuestoEditandoId === idPresupuesto) {
            presupuestoEditandoId = null;
            overlay.classList.add("oculto");
        }

        actualizarVistaPresupuestos();
    }

    // ---- Cerrar el formulario al presionar "Cancelar" ----
    btnCancelar.addEventListener("click", function () {
        presupuestoEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
        ocultarError();
    });

    // ---- Guardar (crear o actualizar) ----
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const monto = Number(inputMonto.value);
        const abono = Number(inputAbono.value);

        // Validaciones pedidas: sin negativos, sin abono mayor al monto.
        if (monto < 0 || abono < 0) {
            mostrarError("El monto y el abono no pueden ser negativos.");
            return;
        }

        if (abono > monto) {
            mostrarError("El abono no puede ser mayor que el monto total.");
            return;
        }

        if (!selectProyecto.value) {
            mostrarError("Debes seleccionar un proyecto.");
            return;
        }

        ocultarError();

        const deuda = calcularDeuda(monto, abono);
        const estado = calcularEstado(deuda);

        // Ya NO guardamos nombre de proyecto ni de cliente aquí: solo el
        // id. El nombre se consulta con obtenerProyectoPorId() cuando se
        // necesita mostrar (en la tabla, por ejemplo).
        const datosFormulario = {
            proyectoId: selectProyecto.value,
            monto: monto,
            abono: abono,
            deuda: deuda,
            estado: estado,
            fechaLimitePago: document.getElementById("fechaLimitePago").value,
            notas: document.getElementById("notasPresupuesto").value
        };

        if (presupuestoEditandoId) {
            // MODO EDITAR
            // FUTURO: Firebase — updateDoc(doc(db, "presupuestos", id), datosFormulario).
            const presupuesto = presupuestos.find(function (p) {
                return p.id === presupuestoEditandoId;
            });

            Object.assign(presupuesto, datosFormulario);

        } else {
            // MODO CREAR
            // FUTURO: Firebase — addDoc(collection(db, "presupuestos"), nuevoPresupuesto).
            const nuevoPresupuesto = Object.assign(
                { id: "presupuesto" + Date.now() },
                datosFormulario
            );

            presupuestos.push(nuevoPresupuesto);
        }

        actualizarVistaPresupuestos();

        presupuestoEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
    });
}


/* =========================================================
   6. PUNTO DE ENTRADA: qué se ejecuta al cargar la página
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    cargarOpcionesProyecto();
    renderizarPresupuestos();
    conectarEventosPresupuesto();
    conectarBusquedaPresupuestos();
    conectarFiltroEstadoPresupuestos();
});
