// Disuade la exploración casual del código vía clic derecho (no es
// protección real: Ctrl+U/F12 siguen funcionando).
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Licitación actualmente mostrada — la usan las Alertas de Cierre para saber
// a qué oferta real corresponde el cronómetro (antes usaban un dato de prueba
// fijo, ver activarAlertas).
let ofertaActual = null;

async function obtenerOfertas() {
    const tema = document.getElementById("temaInput").value.trim();

    if (!tema) {
        alert("Por favor, ingresa un código de temática.");
        return;
    }

    const url = `/api/licitaciones?codigo=${encodeURIComponent(tema)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.Listado && data.Listado.length > 0) {
            const oferta = data.Listado[0]; // Obtén la primera oferta
            ofertaActual = oferta;
            mostrarOfertas(data.Listado);
            iniciarCronometro(oferta); // Llama a iniciarCronometro pasando la oferta
        } else {
            ofertaActual = null;
            alert("No se encontraron ofertas para el código ingresado.");
        }
    } catch (error) {
        console.error("Error al obtener las ofertas:", error);
        alert("Hubo un error al obtener los datos. Por favor, intenta nuevamente.");
    }
}

function mostrarOfertas(ofertas) {
    const tabla = document.getElementById("tablaOfertas");
    tabla.innerHTML = ""; // Limpiar la tabla antes de agregar nuevas filas

    ofertas.forEach(oferta => {
        const montoEstimado = oferta.MontoEstimado || 0; // Asegúrate de que este valor existe
        const iva = montoEstimado * 0.19;
        const montoNeto = montoEstimado - iva;

        const fila = `<tr>
            <td>${oferta.Nombre}</td>
            <td>$ ${montoEstimado.toLocaleString('es-CL')}</td>
            <td>$ ${iva.toLocaleString('es-CL')}</td>
            <td>$ ${montoNeto.toLocaleString('es-CL')}</td>
        </tr>`;
        tabla.insertAdjacentHTML("beforeend", fila);

        // Verificar y actualizar detalles de la oferta
        if (document.getElementById("descripcionOferta")) {
            document.getElementById("descripcionOferta").textContent = oferta.Descripcion || 'N/A';
        }
        if (document.getElementById("fuenteFinanciamiento")) {
            document.getElementById("fuenteFinanciamiento").textContent = oferta.FuenteFinanciamiento || 'N/A';
        }
        if (document.getElementById("Currency")) {
            document.getElementById("Currency").textContent = oferta.Moneda || 'N/A';
        }
        if (document.getElementById("nombreOrganismo")) {
            document.getElementById("nombreOrganismo").textContent = oferta.Comprador.NombreOrganismo || 'N/A';
        }
        if (document.getElementById("Rut")) {
            document.getElementById("Rut").textContent = oferta.Comprador.RutUnidad || 'N/A';
        }
        if (document.getElementById("direccionOrganismo")) {
            document.getElementById("direccionOrganismo").textContent = oferta.Comprador.DireccionUnidad || 'N/A';
        }
        if (document.getElementById("comunaOrganismo")) {
            document.getElementById("comunaOrganismo").textContent = oferta.Comprador.ComunaUnidad || 'N/A';
        }
        if (document.getElementById("regionOrganismo")) {
            document.getElementById("regionOrganismo").textContent = oferta.Comprador.RegionUnidad || 'N/A';
        }
        if (document.getElementById("tiempoContrato")) {
            document.getElementById("tiempoContrato").textContent = oferta.TiempoDuracionContrato || 'N/A';
        }

        // Mapeo de equivalencias para las unidades de tiempo
        const unidadTiempoEquivalencia = {
            1: "Horas",
            2: "Días",
            3: "Semanas",
            4: "Meses",
            5: "Años"
        };

        // Verificar si el elemento existe y actualizar su contenido
        if (document.getElementById("unidadTiempo")) {
            const unidadTiempo = unidadTiempoEquivalencia[oferta.UnidadTiempoDuracionContrato] || 'N/A';
            document.getElementById("unidadTiempo").textContent = unidadTiempo;
        }

        // Función para formatear las fechas
        if (document.getElementById("fechaCreacion")) {
            document.getElementById("fechaCreacion").textContent = formatearFecha(oferta.Fechas.FechaPublicacion) || 'N/A';
        }
        if (document.getElementById("fechaCierre")) {
            document.getElementById("fechaCierre").textContent = formatearFecha(oferta.Fechas.FechaCierre) || 'N/A';
        }
        if (document.getElementById("fechaAdjudicacion")) {
            document.getElementById("fechaAdjudicacion").textContent = formatearFecha(oferta.Fechas.FechaAdjudicacion) || 'N/A';
        }
        if (document.getElementById("fechainiciopreguntas")) {
            document.getElementById("fechainiciopreguntas").textContent = formatearFecha(oferta.Fechas.FechaInicio) || 'N/A';
        }
        if (document.getElementById("fechafinalpreguntas")) {
            document.getElementById("fechafinalpreguntas").textContent = formatearFecha(oferta.Fechas.FechaFinal) || 'N/A';
        }
    });
}

//Cronometro

let cronometroInterval; // Asegúrate de que esta variable esté definida

// Función para limpiar el cronómetro
function detenerCronometro() {
    if (cronometroInterval) {
        clearInterval(cronometroInterval);
        cronometroInterval = null; // Restablecer el intervalo a null
    }
    document.getElementById("cronometro").textContent = ""; // Limpiar el contenido del cronómetro
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    if (isNaN(fecha.getTime())) return 'N/A'; // Verifica si la fecha es válida
    const opcionesFechaHora = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
    };
    return fecha.toLocaleString('es-CL', opcionesFechaHora);
}

function iniciarCronometro(oferta) {
    detenerCronometro(); // Detener cualquier cronómetro existente

    const fechaCierre = new Date(oferta.Fechas.FechaCierre); // Asegúrate de que este valor exista
    const ahora = new Date();

    
    // Actualizar la fecha de cierre en el DOM
    const fechaCierreFormateada = formatearFecha(oferta.Fechas.FechaCierre);
    console.log("Fecha de cierre formateada antes de actualizar el DOM:", fechaCierreFormateada); // Agrega este console.log para depuración
    document.getElementById("fechaCierre_1").textContent = fechaCierreFormateada;


    // Calcular el tiempo restante en milisegundos
    const tiempoRestante = fechaCierre - ahora;

    if (tiempoRestante > 0) {
        actualizarCronometro(tiempoRestante); // Mostrar el cronómetro inicial

        // Actualizar el cronómetro cada segundo
        cronometroInterval = setInterval(() => {
            const ahora = new Date();
            const tiempoRestante = fechaCierre - ahora;

            if (tiempoRestante <= 0) {
                clearInterval(cronometroInterval);
                cronometroInterval = null; // Restablecer el intervalo a null
                document.getElementById("cronometro").textContent = "La oferta ha cerrado.";
            } else {
                actualizarCronometro(tiempoRestante); // Actualizar el cronómetro
            }
        }, 1000);
    } else {
        document.getElementById("cronometro").textContent = "La oferta ha cerrado.";
    }
}

// Función para actualizar el cronómetro en la interfaz
function actualizarCronometro(tiempoRestante) {
    const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
    const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

    document.getElementById("cronometro").textContent = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

//Exportar EXCEL

function exportarXLSX() {
    // Recolectar los datos que quieres exportar
    const descripcion = document.getElementById("descripcionOferta").textContent;
    const fuenteFinanciamiento = document.getElementById("fuenteFinanciamiento").textContent;
    const moneda = document.getElementById("Currency").textContent;
    const nombreOrganismo = document.getElementById("nombreOrganismo").textContent;
    const rutOrganismo = document.getElementById("Rut").textContent;
    const direccionOrganismo = document.getElementById("direccionOrganismo").textContent;
    const comunaOrganismo = document.getElementById("comunaOrganismo").textContent;
    const regionOrganismo = document.getElementById("regionOrganismo").textContent;
    const tiempoContrato = document.getElementById("tiempoContrato").textContent;
    const unidadTiempo = document.getElementById("unidadTiempo").textContent;
    
    const fechaCreacion = document.getElementById("fechaCreacion").textContent;
    const fechaCierre = document.getElementById("fechaCierre").textContent;
    const fechaInicioPreguntas = document.getElementById("fechainiciopreguntas").textContent;
    const fechaFinalPreguntas = document.getElementById("fechafinalpreguntas").textContent;
    const fechaAdjudicacion = document.getElementById("fechaAdjudicacion").textContent;

    // Crear los datos en un formato que SheetJS pueda manejar
    const data = [
        ["Descripción", "Fuente Financiamiento", "Moneda", "Nombre Organismo", "RUT Organismo", "Dirección Organismo", "Comuna Organismo", "Región Organismo", "Tiempo Contrato", "Unidad Tiempo", "Fecha Creación", "Fecha Cierre", "Fecha Inicio Preguntas", "Fecha Final Preguntas", "Fecha Adjudicación"],
        [descripcion, fuenteFinanciamiento, moneda, nombreOrganismo, rutOrganismo, direccionOrganismo, comunaOrganismo, regionOrganismo, tiempoContrato, unidadTiempo, fechaCreacion, fechaCierre, fechaInicioPreguntas, fechaFinalPreguntas, fechaAdjudicacion]
    ];

    // Crea una hoja de cálculo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Oferta");

    // Genera un archivo XLSX y permite su descarga
    XLSX.writeFile(wb, "oferta.xlsx");
}


//Boton de enviar Alerta

function activarAlertas() {
    if (!ofertaActual) {
        alert("Primero busca una licitación.");
        return;
    }

    const email = document.getElementById("correoAlerta").value.trim();
    if (!email) {
        alert("Ingresa un correo para las alertas.");
        return;
    }

    const fechaCierre = new Date(ofertaActual.Fechas.FechaCierre);
    if (isNaN(fechaCierre.getTime())) {
        console.error("Fecha de cierre inválida");
        return;
    }

    // Los avisos se agendan con setTimeout: solo se disparan mientras esta
    // pestaña siga abierta. Notificaciones reales tras cerrar el navegador
    // requerirían un backend con tareas programadas, que este sitio (estático)
    // todavía no tiene.
    const opciones = [
        { id: "alerta1h", horas: 1, texto: "1 hora" },
        { id: "alerta24h", horas: 24, texto: "24 horas" },
        { id: "alerta48h", horas: 48, texto: "48 horas" },
        { id: "alerta72h", horas: 72, texto: "72 horas" },
    ];

    let agendadas = 0;
    let yaVencidas = 0;

    opciones.forEach(({ id, horas, texto }) => {
        if (!document.getElementById(id).checked) return;

        const ahora = new Date();
        const delay = fechaCierre - ahora - horas * 60 * 60 * 1000;

        if (delay <= 0) {
            yaVencidas++;
            return;
        }

        setTimeout(() => enviarAlerta(email, `Te recordamos que tu oferta cierra en ${texto}.`), delay);
        agendadas++;
    });

    if (agendadas === 0 && yaVencidas === 0) {
        alert("Marca al menos un recordatorio.");
        return;
    }

    let mensaje = agendadas > 0
        ? `Se agendaron ${agendadas} recordatorio(s) (mantén esta pestaña abierta).`
        : "No se agendó ningún recordatorio.";
    if (yaVencidas > 0) {
        mensaje += ` ${yaVencidas} ya no aplican porque quedan menos horas que las seleccionadas.`;
    }
    alert(mensaje);
}

function enviarAlerta(email, mensaje) {
    emailjs.send("service_5gyggkr", "template_i2hcmdj", {
        to_email: email,
        subject: "Recordatorio de cierre — Mercado Eficiente",
        message: mensaje,
        reply_to: email,
    }).then(() => {
        console.log(`Alerta enviada a ${email}: ${mensaje}`);
    }, (error) => {
        console.error("Error al enviar alerta:", error);
    });
}


//Historial de busqueda



// Correo de Aviso
emailjs.init("e8UTu4GeibxTJ2A_r"); // Tu Public Key

$(document).ready(function () {
    // Cuando se presiona el botón "Enviar Aviso"
    $("#btnAvisarResultado").click(function () {
        verificarResultados();
    });
});

function verificarResultados() {
    const tema = document.getElementById("temaInput").value.trim();
    const email = document.getElementById("correoAviso").value.trim();

    if (!tema) {
        alert("Ingresa un código de temática.");
        return;
    }
    if (!email) {
        alert("Ingresa un correo para el aviso.");
        return;
    }

    fetch(`/api/licitaciones?codigo=${encodeURIComponent(tema)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const proyecto = data && data.Listado && data.Listado[0];
            const item = proyecto && proyecto.Items && proyecto.Items.Listado && proyecto.Items.Listado[0];

            if (item && item.Adjudicacion && item.Adjudicacion.NombreProveedor) {
                const cantidad = item.Adjudicacion.Cantidad;
                const montoUnitario = item.Adjudicacion.MontoUnitario;
                const total = cantidad * montoUnitario;

                const urlActa = (proyecto.Adjudicacion && proyecto.Adjudicacion.UrlActa) || 'No disponible';
                const mensaje = `Se ha adjudicado el Proyecto "${proyecto.Nombre}" al Proveedor "${item.Adjudicacion.NombreProveedor}", Rut "${item.Adjudicacion.RutProveedor}" con una cantidad de "${cantidad}" por un monto unitario de $"${montoUnitario}", siendo el total el resultado de esto: ${cantidad} * ${montoUnitario} = $${total}. Para más detalles, ver "${urlActa}"`;

                enviarCorreo(email, mensaje);
            } else {
                alert("Aún no hay información de adjudicación para esta licitación.");
            }
        })
        .catch(error => {
            console.error("Error al verificar los resultados:", error);
            alert("Hubo un problema al verificar los resultados.");
        });
}

function enviarCorreo(email, mensaje) {
    const templateParams = {
        to_email: email,
        subject: "Notificación de Adjudicación de Proyecto",
        message: mensaje,
        reply_to: email
    };

    emailjs.send("service_5gyggkr", "template_i2hcmdj", templateParams)
        .then(function() {
            mostrarMensajeSuscripcion();
        }, function(error) {
            console.error('Error al enviar correo', error);
            alert("Error al enviar el correo.");
        });
}

function mostrarMensajeSuscripcion() {
    $("#mensajeSuscripcion").text("Correo enviado ✓").fadeIn().delay(3000).fadeOut();
}


// Licitaciones activas al cargar la página — antes la tabla quedaba vacía
// hasta que alguien buscaba un código a mano, lo que además de mala UX hacía
// que la home no tuviera contenido real para un rastreador (Google, etc.).
// NOTA: "estado=activas" y el campo "CodigoExterno" siguen el patrón
// documentado de la API de Mercado Público, pero no se probaron contra un
// ticket real todavía — conviene confirmarlos apenas se despliegue.
async function cargarLicitacionesRecientes() {
    try {
        const response = await fetch('/api/licitaciones?estado=activas');
        if (!response.ok) return;
        const data = await response.json();
        const listado = (data && data.Listado) || [];
        if (listado.length === 0) return;
        mostrarListadoTabla(listado.slice(0, 10));
    } catch (error) {
        console.error('No se pudo cargar el listado inicial de licitaciones activas:', error);
    }
}

function mostrarListadoTabla(ofertas) {
    const tabla = document.getElementById("tablaOfertas");
    tabla.innerHTML = "";

    ofertas.forEach(oferta => {
        const montoEstimado = oferta.MontoEstimado || 0;
        const iva = montoEstimado * 0.19;
        const montoNeto = montoEstimado - iva;
        const codigo = oferta.CodigoExterno || '';

        const fila = `<tr class="fila-licitacion" data-codigo="${codigo}" style="cursor:pointer;">
            <td>${oferta.Nombre}</td>
            <td>$ ${montoEstimado.toLocaleString('es-CL')}</td>
            <td>$ ${iva.toLocaleString('es-CL')}</td>
            <td>$ ${montoNeto.toLocaleString('es-CL')}</td>
        </tr>`;
        tabla.insertAdjacentHTML("beforeend", fila);
    });

    // Clic en una fila: la busca en detalle, igual que si se hubiera escrito
    // su código a mano.
    tabla.querySelectorAll(".fila-licitacion").forEach(fila => {
        fila.addEventListener("click", () => {
            const codigo = fila.dataset.codigo;
            if (!codigo) return;
            document.getElementById("temaInput").value = codigo;
            obtenerOfertas();
        });
    });
}

document.addEventListener("DOMContentLoaded", cargarLicitacionesRecientes);

//Hora y fecha al lado derecho
function actualizarFechaHora() {
    const fechaHoraElemento = document.getElementById("fechaHora");
    const ahora = new Date();
    const opciones = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    fechaHoraElemento.textContent = ahora.toLocaleDateString('es-ES', opciones);
}
setInterval(actualizarFechaHora, 1000); // Actualiza cada segundo


//MERCADO PUBLICO --> ver proyectos
document.getElementById('temaInput').addEventListener('input', function () {
    const inputValor = this.value.trim();
    const botonVer = document.getElementById('verMercadoPublico');

    if (inputValor) {
        botonVer.disabled = false;
        botonVer.onclick = function () {
            window.open(`http://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${inputValor}`, '_blank');
        };
    } else {
        botonVer.disabled = true;
    }
});