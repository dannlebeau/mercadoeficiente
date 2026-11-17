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
        const { total, iva, neto } = desglosarIva(oferta.MontoEstimado);

        // Los datos vienen de la API: se insertan como texto, nunca como HTML (evita XSS).
        const fila = document.createElement("tr");
        [oferta.Nombre || "N/A", formatearPesos(total), formatearPesos(iva), formatearPesos(neto)]
            .forEach(texto => {
                const celda = document.createElement("td");
                celda.textContent = texto;
                fila.appendChild(celda);
            });
        tabla.appendChild(fila);

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

// El monto estimado de Mercado Público incluye IVA: neto = total / 1,19.
function desglosarIva(montoTotal) {
    const total = Number(montoTotal) || 0;
    const neto = Math.round(total / 1.19);
    return { total, iva: total - neto, neto };
}

function formatearPesos(monto) {
    return `$ ${monto.toLocaleString('es-CL')}`;
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


// Alertas de cierre: genera un evento .ics con recordatorios (VALARM). El
// calendario del usuario avisa aunque cierre esta pestaña; no se envían
// correos desde el navegador.
function descargarRecordatorio() {
    if (!ofertaActual) {
        alert("Primero busca una licitación.");
        return;
    }

    const fechaCierre = new Date(ofertaActual.Fechas.FechaCierre);
    if (isNaN(fechaCierre.getTime())) {
        alert("Esta licitación no tiene una fecha de cierre válida.");
        return;
    }
    if (fechaCierre <= new Date()) {
        alert("Esta licitación ya cerró.");
        return;
    }

    const horas = [1, 24, 48, 72].filter(h => document.getElementById(`alerta${h}h`).checked);
    if (horas.length === 0) {
        alert("Marca al menos un recordatorio.");
        return;
    }

    const ics = generarIcs(ofertaActual, fechaCierre, horas);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `cierre-${ofertaActual.CodigoExterno || "licitacion"}.ics`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(enlace.href);
}

function fechaIcs(fecha) {
    return fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Escapa texto según RFC 5545 (\ ; , y saltos de línea).
function textoIcs(texto) {
    return String(texto || "")
        .replace(/\\/g, "\\\\")
        .replace(/[;,]/g, m => "\\" + m)
        .replace(/\r?\n/g, "\\n");
}

function generarIcs(oferta, fechaCierre, horas) {
    const codigo = oferta.CodigoExterno || "";
    const titulo = `Cierre licitación ${codigo}: ${oferta.Nombre || ""}`;
    const url = `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(codigo)}`;
    const alarmas = horas.map(h => [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${textoIcs(`Cierra en ${h} hora(s): ${titulo}`)}`,
        `TRIGGER:-PT${h}H`,
        "END:VALARM",
    ].join("\r\n"));

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Mercado Eficiente//Alertas de cierre//ES",
        "BEGIN:VEVENT",
        `UID:${fechaIcs(new Date())}-${codigo}@mercadoeficiente.cl`,
        `DTSTAMP:${fechaIcs(new Date())}`,
        `DTSTART:${fechaIcs(fechaCierre)}`,
        `DTEND:${fechaIcs(fechaCierre)}`,
        `SUMMARY:${textoIcs(titulo)}`,
        `DESCRIPTION:${textoIcs(`Organismo: ${(oferta.Comprador && oferta.Comprador.NombreOrganismo) || "N/A"}\n${url}`)}`,
        `URL:${url}`,
        ...alarmas,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
}


// Resultado de adjudicación: se muestra en pantalla (antes se enviaba por
// EmailJS desde el navegador a cualquier correo, lo que permitía usar la
// cuenta para enviar spam).
function verResultado() {
    const tema = document.getElementById("temaInput").value.trim();
    const salida = document.getElementById("resultadoAdjudicacion");
    const boton = document.getElementById("btnVerResultado");

    if (!tema) {
        alert("Ingresa un código de temática.");
        return;
    }

    boton.disabled = true;
    salida.textContent = "Consultando…";

    fetch(`/api/licitaciones?codigo=${encodeURIComponent(tema)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Respuesta no válida: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            const proyecto = data && data.Listado && data.Listado[0];
            const items = (proyecto && proyecto.Items && proyecto.Items.Listado) || [];
            const adjudicados = items.filter(i => i.Adjudicacion && i.Adjudicacion.NombreProveedor);

            if (adjudicados.length === 0) {
                salida.textContent = "Aún no hay información de adjudicación para esta licitación.";
                return;
            }

            const lineas = adjudicados.map(i => {
                const total = (Number(i.Adjudicacion.Cantidad) || 0) * (Number(i.Adjudicacion.MontoUnitario) || 0);
                return `${i.Adjudicacion.NombreProveedor} (RUT ${i.Adjudicacion.RutProveedor}): ` +
                    `${i.Adjudicacion.Cantidad} × ${formatearPesos(Number(i.Adjudicacion.MontoUnitario) || 0)} = ${formatearPesos(total)}`;
            });
            const urlActa = proyecto.Adjudicacion && proyecto.Adjudicacion.UrlActa;
            salida.textContent = `Adjudicada: ${lineas.join(" · ")}` + (urlActa ? ` · Acta: ${urlActa}` : "");
        })
        .catch(error => {
            console.error("Error al verificar los resultados:", error);
            salida.textContent = "Hubo un problema al consultar el resultado. Intenta nuevamente.";
        })
        .finally(() => {
            boton.disabled = false;
        });
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
            window.open(`https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(inputValor)}`, '_blank', 'noopener');
        };
    } else {
        botonVer.disabled = true;
    }
});