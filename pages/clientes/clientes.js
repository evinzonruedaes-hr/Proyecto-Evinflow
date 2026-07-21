/*
    clientes.js
    -----------
    Lógica del módulo de Clientes. Por ahora todo se guarda en un arreglo
    de JavaScript (en memoria, se pierde al recargar la página). Está
    organizado para que, cuando conectes Firebase, solo tengas que
    reemplazar 3 puntos concretos (marcados abajo con "FUTURO: Firebase").
*/


/* =========================================================
   1. DATOS: el arreglo que hace de "base de datos" temporal
   ========================================================= */

// FUTURO: Firebase — este arreglo se reemplazará por los documentos
// que traigas de la colección "clientes" en Firestore.
let clientes = [
    {
        id: "cliente1",
        nombre: "Grupo Empresarial SAS",
        correo: "contacto@grupoempresarial.com",
        telefono: "+57 300 123 4567",
        empresa: "Grupo Empresarial SAS",
        fecha: "10 May 2026"
    },
    {
        id: "cliente2",
        nombre: "Constructora del Valle",
        correo: "info@constructoradelvalle.com",
        telefono: "+57 301 987 6543",
        empresa: "Constructora del Valle",
        fecha: "15 May 2026"
    },
    {
        id: "cliente3",
        nombre: "María Fernanda López",
        correo: "mflopez@correo.com",
        telefono: "+57 302 555 1122",
        empresa: "—",
        fecha: "02 Jun 2026"
    }
];

// Guarda el id del cliente que se está editando. Mientras esté en null,
// el formulario funciona en modo "crear". Cuando tiene un id, funciona
// en modo "editar".
let clienteEditandoId = null;


/* =========================================================
   2. DIBUJAR LA TABLA a partir del arreglo "clientes"
   ========================================================= */

// El parámetro "listaClientes" es OPCIONAL. Si se llama a la función sin
// nada (como ya se hacía en Crear/Editar/Eliminar), dibuja el arreglo
// completo "clientes". Si se le pasa un arreglo distinto (por ejemplo, los
// resultados de una búsqueda), dibuja ESE arreglo en su lugar.
function renderizarClientes(listaClientes) {
    const lista = listaClientes || clientes;
    const tbody = document.getElementById("tablaClientesBody");

    // Limpiamos la tabla y la volvemos a construir completa cada vez.
    // Es más simple de entender que ir agregando/quitando filas sueltas.
    tbody.innerHTML = "";

    lista.forEach(function (cliente) {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.correo}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.empresa}</td>
            <td>${cliente.fecha}</td>
            <td class="celda-acciones">
                <button class="btn-icono btn-editar" data-id="${cliente.id}">Editar</button>
                <button class="btn-icono btn-eliminar" data-id="${cliente.id}">Eliminar</button>
            </td>
        `;

        tbody.appendChild(fila);
    });
}


/* =========================================================
   3. BUSCAR CLIENTES (en tiempo real)
   ========================================================= */

// Revisa si el texto buscado aparece en el nombre, correo o empresa de
// cada cliente. Se pasa todo a minúsculas para que no importe si el
// usuario escribe con mayúsculas o minúsculas.
function filtrarClientes(texto) {
    const textoBusqueda = texto.toLowerCase().trim();

    // Si no escribió nada, devolvemos el arreglo completo sin filtrar.
    if (textoBusqueda === "") {
        return clientes;
    }

    return clientes.filter(function (cliente) {
        const nombreCoincide = cliente.nombre.toLowerCase().includes(textoBusqueda);
        const correoCoincide = cliente.correo.toLowerCase().includes(textoBusqueda);
        const empresaCoincide = cliente.empresa.toLowerCase().includes(textoBusqueda);

        return nombreCoincide || correoCoincide || empresaCoincide;
    });
}

// Muestra el mensaje "No se encontraron clientes" solo cuando la lista
// de resultados viene vacía; lo oculta en cualquier otro caso.
function actualizarMensajeVacio(listaResultados) {
    const mensaje = document.getElementById("mensajeSinClientes");

    if (listaResultados.length === 0) {
        mensaje.textContent = "No se encontraron clientes";
        mensaje.classList.remove("oculto");
    } else {
        mensaje.classList.add("oculto");
    }
}

// Conecta el evento "input" al campo de búsqueda. Este evento se dispara
// cada vez que el usuario escribe o borra una letra (a diferencia de
// "change", que solo se dispara cuando el campo pierde el foco).
function conectarBusquedaClientes() {
    const inputBuscador = document.getElementById("buscadorClientes");

    inputBuscador.addEventListener("input", function () {
        const resultados = filtrarClientes(inputBuscador.value);
        renderizarClientes(resultados);
        actualizarMensajeVacio(resultados);
    });
}

// Vuelve a dibujar la tabla RESPETANDO el filtro que el usuario tenga
// escrito en el buscador en ese momento. Se usa después de crear, editar
// o eliminar un cliente, para que la búsqueda no se pierda.
// Reutiliza filtrarClientes() y actualizarMensajeVacio(), que ya existían.
function actualizarVistaClientes() {
    const inputBuscador = document.getElementById("buscadorClientes");
    const resultados = filtrarClientes(inputBuscador.value);

    renderizarClientes(resultados);
    actualizarMensajeVacio(resultados);
}


/* =========================================================
   4. ABRIR / CERRAR / GUARDAR — eventos del formulario
   ========================================================= */
// El formulario ya viene escrito directamente en clientes.html (ya no se
// carga desde otro archivo), así que sus elementos existen desde el
// principio y podemos conectarles los eventos sin esperar nada.

function conectarEventosFormulario() {
    const overlay = document.getElementById("formularioCliente");
    const btnCancelar = document.getElementById("btnCancelarCliente");
    const formulario = document.getElementById("formCliente");
    const titulo = document.getElementById("tituloFormulario");
    const tbody = document.getElementById("tablaClientesBody");

    // Abrir el formulario en modo "crear" al presionar "+ Nuevo cliente"
    const btnNuevo = document.getElementById("btnNuevoCliente");
    btnNuevo.addEventListener("click", function () {
        clienteEditandoId = null; // nos aseguramos de NO estar en modo edición
        titulo.textContent = "Nuevo cliente";
        formulario.reset();
        overlay.classList.remove("oculto");
    });

    // Abrir el formulario en modo "editar" al presionar "Editar" en una fila,
    // o eliminar un cliente al presionar "Eliminar". Los botones se recrean
    // cada vez que se redibuja la tabla, así que en vez de conectarles un
    // evento a cada uno, ponemos UN SOLO listener en el <tbody> y revisamos
    // qué botón fue el que se clickeó.
    tbody.addEventListener("click", function (evento) {
        const boton = evento.target;

        if (boton.classList.contains("btn-editar")) {
            abrirFormularioParaEditar(boton.dataset.id);
        }

        if (boton.classList.contains("btn-eliminar")) {
            eliminarCliente(boton.dataset.id);
        }
    });

    function abrirFormularioParaEditar(idCliente) {
        const cliente = clientes.find(function (c) {
            return c.id === idCliente;
        });

        if (!cliente) {
            return;
        }

        // Guardamos qué cliente se está editando y llenamos el formulario
        // con sus datos actuales.
        clienteEditandoId = cliente.id;
        titulo.textContent = "Editar cliente";
        document.getElementById("nombreCliente").value = cliente.nombre;
        document.getElementById("correoCliente").value = cliente.correo;
        document.getElementById("telefonoCliente").value = cliente.telefono;
        document.getElementById("empresaCliente").value =
            cliente.empresa === "—" ? "" : cliente.empresa;

        overlay.classList.remove("oculto");
    }

    function eliminarCliente(idCliente) {
        const cliente = clientes.find(function (c) {
            return c.id === idCliente;
        });

        if (!cliente) {
            return;
        }

        const confirmado = confirm(
            "¿Seguro que quieres eliminar a " + cliente.nombre + "?"
        );

        if (!confirmado) {
            return;
        }

        // FUTURO: Firebase — en vez de esto, deleteDoc(doc(db, "clientes", idCliente)).
        clientes = clientes.filter(function (c) {
            return c.id !== idCliente;
        });

        // Si justo estábamos editando al cliente que se acaba de eliminar,
        // cerramos el formulario para no dejarlo abierto editando algo
        // que ya no existe en la tabla.
        if (clienteEditandoId === idCliente) {
            clienteEditandoId = null;
            overlay.classList.add("oculto");
        }

        // Antes: renderizarClientes(). Ahora usamos actualizarVistaClientes()
        // para que, si había un texto de búsqueda activo, la tabla siga
        // mostrando solo esos resultados en vez de la lista completa.
        actualizarVistaClientes();
    }

    // Cerrar el formulario al presionar "Cancelar"
    btnCancelar.addEventListener("click", function () {
        clienteEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset(); // limpia los campos para que no queden datos de la última vez
    });

    // Guardar el formulario: crea un cliente nuevo, o actualiza uno
    // existente si estamos en modo edición.
    formulario.addEventListener("submit", function (evento) {
        // Evita que la página se recargue (comportamiento normal de un form)
        evento.preventDefault();

        const datosFormulario = {
            nombre: document.getElementById("nombreCliente").value,
            correo: document.getElementById("correoCliente").value,
            telefono: document.getElementById("telefonoCliente").value,
            empresa: document.getElementById("empresaCliente").value || "—"
        };

        if (clienteEditandoId) {
            // MODO EDITAR: buscamos el cliente en el arreglo y actualizamos
            // sus datos, conservando su id y su fecha de registro original.
            // FUTURO: Firebase — aquí iría updateDoc(doc(db, "clientes", id), datosFormulario).
            const cliente = clientes.find(function (c) {
                return c.id === clienteEditandoId;
            });

            cliente.nombre = datosFormulario.nombre;
            cliente.correo = datosFormulario.correo;
            cliente.telefono = datosFormulario.telefono;
            cliente.empresa = datosFormulario.empresa;

        } else {
            // MODO CREAR: agregamos un cliente nuevo al arreglo.
            // FUTURO: Firebase — en vez de esto, addDoc(collection(db, "clientes"), nuevoCliente).
            const nuevoCliente = {
                id: "cliente" + Date.now(), // id temporal único mientras no hay Firebase
                nombre: datosFormulario.nombre,
                correo: datosFormulario.correo,
                telefono: datosFormulario.telefono,
                empresa: datosFormulario.empresa,
                fecha: new Date().toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                })
            };

            clientes.push(nuevoCliente);
        }

        // Antes: renderizarClientes(). Ahora usamos actualizarVistaClientes()
        // para que, si el usuario tenía un texto de búsqueda activo, la
        // tabla siga mostrando solo esos resultados (tanto al crear como
        // al editar un cliente).
        actualizarVistaClientes();

        clienteEditandoId = null;
        overlay.classList.add("oculto");
        formulario.reset();
    });
}


/* =========================================================
   5. PUNTO DE ENTRADA: qué se ejecuta al cargar la página
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    renderizarClientes();
    conectarEventosFormulario();
    conectarBusquedaClientes();
});
