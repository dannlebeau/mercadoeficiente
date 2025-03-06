async function obtenerOfertas() {
    const tema = document.getElementById("temaInput").value.trim();
    const apiKey = "B23CB497-A854-4680-B86F-AE4E69F019E2"; // Tu clave de API
    const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${tema}&ticket=${apiKey}`;

    if (!tema) {
        alert("Por favor, ingresa un código de temática.");
        return;
    }

    console.log('URL generada:', url); // Verificar la URL generada

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Respuesta de la API:", data); // Verificar la estructura de la respuesta
        
        if (data.Listado && data.Listado.length > 0) {
            const oferta = data.Listado[0]; // Obtén la primera oferta
            mostrarOfertas(data.Listado);
            iniciarCronometro(oferta); // Llama a iniciarCronometro pasando la oferta
        } else {
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

// Datos de coordenadas de ejemplo
const comunasCoords = {
    "Santiago": { lat: -33.45694, lng: -70.64827 },
    "Valparaíso": { lat: -33.04724, lng: -71.61269 },
    // Agrega más comunas según necesites
};

// Función para obtener las coordenadas según el nombre de la comuna
function obtenerCoordenadas(comuna) {
    return comunasCoords[comuna] || null;
}


//---JQuery//
$(document).ready(function () {
    // Mostrar el modal de bienvenida al cargar la página
    $('#modalBienvenida').modal('show');

    // Ocultar el modal cuando se hace clic en "Aceptar"
    $('#btnAceptar').click(function () {
        $('#modalBienvenida').modal('hide');
    });
});

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

 // Define oferta en el ámbito global

const oferta = {
    Fechas: {
        FechaCierre: "2024-12-01T12:00:00Z" // Asegúrate de usar un formato válido
    }
};

function activarAlertas() {
    const email = document.getElementById("correoAlerta").value;
    const fechaCierre = new Date(oferta.Fechas.FechaCierre);
    const ahora = new Date();
    const tiempoRestante = fechaCierre - ahora;

    alert("Alerta activada");

    if (isNaN(fechaCierre.getTime())) {
        console.error("Fecha de cierre inválida");
        return;
    }

    console.log(`Tiempo restante para la oferta: ${tiempoRestante} ms`);

    if (document.getElementById("alerta1h").checked) {
        console.log("Configurando alerta de 1 hora...");
        setTimeout(() => enviarAlerta(email, "Te recordamos que tu oferta cierra en 1 hora."), tiempoRestante - (1000 * 60 * 60));
    }
}
    if (document.getElementById("alerta24h").checked) {
        console.log("Configurando alerta de 24 horas...");
        setTimeout(() => enviarAlerta(email, "Te recordamos que tu oferta cierra en 24 horas."), tiempoRestante - (1000 * 60 * 60 * 24));
    }
    if (document.getElementById("alerta48h").checked) {
        console.log("Configurando alerta de 48 horas...");
        setTimeout(() => enviarAlerta(email, "Te recordamos que tu oferta cierra en 48 horas."), tiempoRestante - (1000 * 60 * 60 * 24 * 2));
    }
    if (document.getElementById("alerta72h").checked) {
        console.log("Configurando alerta de 72 horas...");
        setTimeout(() => enviarAlerta(email, "Te recordamos que tu oferta cierra en 72 horas."), tiempoRestante - (1000 * 60 * 60 * 24 * 3));
    }

function enviarAlerta(email, mensaje) {
    // Implementa aquí la lógica para enviar el correo
    console.log(`Enviando alerta a ${email}: ${mensaje}`);
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
    const tema = document.getElementById("temaInput").value; // Código del tema
    console.log("Código del tema ingresado:", tema); // Debug: Verifica el valor del tema ingresado
    
    const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${tema}&ticket=B23CB497-A854-4680-B86F-AE4E69F019E2`; // URL de la API
    console.log("URL de la API:", url); // Debug: Verifica la URL que estamos usando para la consulta
    
    fetch(url)
        .then(response => {
            console.log("Respuesta de la API:", response); // Debug: Verifica la respuesta de la API
            if (!response.ok) {
                throw new Error("Network response was not ok: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos de la API:", data); // Debug: Verifica los datos recibidos de la API
            
            if (data && data.Listado && data.Listado.length > 0) {
                const proyecto = data.Listado[0]; // Obtener el primer proyecto
                const item = proyecto.Items.Listado[0]; // Obtener el primer item

                console.log("Proyecto:", proyecto); // Debug: Verifica el primer proyecto
                console.log("Item del proyecto:", item); // Debug: Verifica el primer item

                if (item.Adjudicacion && item.Adjudicacion.NombreProveedor) {
                    // Calcular el total solo si existe la adjudicación
                    const cantidad = item.Adjudicacion.Cantidad;
                    const montoUnitario = item.Adjudicacion.MontoUnitario;
                    const total = cantidad * montoUnitario; // Calcular el total
                    
                    // Construir el mensaje con la URL como hipervínculo
                    const mensaje = `Se ha adjudicado el Proyecto "${proyecto.Nombre}" al Proveedor "${item.Adjudicacion.NombreProveedor}", Rut "${item.Adjudicacion.RutProveedor}" con una cantidad de "${cantidad}" por un monto unitario de $"${montoUnitario}", siendo el total el resultado de esto: ${cantidad} * ${montoUnitario} = $${total}. Para más detalles, ver "${proyecto.Adjudicacion.UrlActa}"`;

                    console.log("Mensaje preparado:", mensaje); // Debug: Verifica el mensaje preparado

                    const email = document.getElementById("correoAviso").value; // Obtener el correo
                    console.log("Correo al que se enviará el mensaje:", email); // Debug: Verifica el correo ingresado
                    enviarCorreo(email, mensaje); // Enviar correo
                } else {
                    alert("No se encontró información de adjudicación.");
                }
            } else {
                alert("No se encontró información de adjudicación.");
            }
        })
        .catch(error => {
            console.error("Error al verificar los resultados:", error);
            alert("Hubo un problema al verificar los resultados. Verifica la consola.");
        });
}

function enviarCorreo(email, mensaje) {
    const templateParams = {
        to_email: email, // Correo del destinatario
        subject: "Notificación de Adjudicación de Proyecto", // Asunto
        message: mensaje, // El mensaje que hemos preparado
        reply_to: email
    };

    console.log("Enviando correo con estos parámetros:", templateParams); // Debug: Verifica los parámetros antes de enviar el correo

    emailjs.send("service_5gyggkr", "template_i2hcmdj", templateParams) // Asegúrate de usar el Template ID correcto
        .then(function(response) {
            console.log('Correo enviado exitosamente', response);
            alert("Correo enviado exitosamente.");
        }, function(error) {
            console.error('Error al enviar correo', error); // Línea comentada
            alert("Error al enviar el correo.");
        });
}

function mostrarMensajeSuscripcion() {
    $("#mensajeSuscripcion").text("Suscrito al aviso").fadeIn().delay(3000).fadeOut(); // Muestra el mensaje por 3 segundos
}


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