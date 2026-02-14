// ACCOUNT REMOVAL GUIDES
export const ACCOUNT_REMOVAL_GUIDES = [
    {
        id: 'icloud',
        title: 'Apple iCloud (iPhone/iPad)',
        icon: 'Apple',
        color: 'gray',
        category: 'cuentas',
        steps: [
            "Abre Ajustes en el dispositivo.",
            "Toca tu nombre (Apple ID) en la parte superior.",
            "Desplázate hasta el final y toca 'Cerrar sesión'.",
            "Introduce la contraseña del Apple ID para desactivar 'Buscar mi iPhone'.",
            "Selecciona qué datos quieres conservar (normalmente ninguno para venta) y confirma."
        ],
        warning: "IMPRESCINDIBLE: Comprobar que 'Buscar mi iPhone' está desactivado en icloud.com/activationlock si es posible."
    },
    {
        id: 'samsung',
        title: 'Samsung Account',
        icon: 'Smartphone',
        color: 'blue',
        category: 'cuentas',
        steps: [
            "Abre Ajustes > Cuentas y respaldo > Administrar cuentas.",
            "Selecciona la cuenta Samsung.",
            "Toca 'Eliminar cuenta'.",
            "Introduce la contraseña de Samsung Account para confirmar.",
            "Si no recuerda la contraseña, habrá que restablecerla por email."
        ]
    },
    {
        id: 'google',
        title: 'Cuenta Google (FRP)',
        icon: 'Chrome',
        color: 'green',
        category: 'cuentas',
        steps: [
            "Abre Ajustes > Cuentas / Usuarios y cuentas.",
            "Selecciona la cuenta de Google.",
            "Toca 'Quitar cuenta'.",
            "Si hay patrón/PIN, lo pedirá para confirmar.",
            "IMPORTANTE: Hacer esto ANTES de restablecer de fábrica para evitar bloqueo FRP."
        ]
    },
    {
        id: 'xiaomi',
        title: 'Cuenta Xiaomi (Mi Account)',
        icon: 'Smartphone',
        color: 'orange',
        category: 'cuentas',
        steps: [
            "Abre Ajustes > Cuenta Mi.",
            "Toca 'Cerrar sesión' en la parte inferior.",
            "Introduce la contraseña de la cuenta Mi o usa 'Olvidé contraseña' vía SMS.",
            "Confirma la eliminación de datos de la nube en el dispositivo."
        ],
        warning: "Si no se cierra, el dispositivo pedirá la contraseña tras el reset (Lock)."
    },
    {
        id: 'huawei',
        title: 'Huawei ID',
        icon: 'Smartphone',
        color: 'red',
        category: 'cuentas',
        steps: [
            "Abre Ajustes > Iniciar sesión con ID de Huawei (o el nombre arriba).",
            "Toca 'Cerrar sesión'.",
            "Introduce la contraseña para desactivar 'Buscar mi teléfono'.",
            "Luego ve a Sistema > Restablecimiento > Restablecer teléfono."
        ]
    },
    {
        id: 'oppo_realme',
        title: 'Oppo / Realme (HeyTap)',
        icon: 'Smartphone',
        color: 'emerald',
        category: 'cuentas',
        steps: [
            "Abre Ajustes > Iniciar sesión (arriba).",
            "Toca 'Cerrar sesión'.",
            "A veces pide contraseña si se activó la seguridad en la nube.",
            "Para quitar cuenta Google: Ajustes > Usuarios y cuentas > Google > : > Quitar cuenta."
        ]
    },
    {
        id: 'apple_watch',
        title: 'Desenlazar Apple Watch',
        icon: 'Watch',
        color: 'orange',
        category: 'dispositivos',
        steps: [
            "Mantén el Apple Watch y el iPhone cerca.",
            "Abre la app Watch en el iPhone.",
            "Toca 'Todos los relojes' arriba a la izquierda.",
            "Toca la 'i' junto al reloj a desenlazar.",
            "Toca 'Desenlazar Apple Watch'. (Si es GPS+Cellular, elige mantener o borrar plan según caso).",
            "Introduce la contraseña del Apple ID para desactivar el bloqueo de activación."
        ]
    },
    {
        id: 'galaxy_watch',
        title: 'Reset Galaxy Watch',
        icon: 'Watch',
        color: 'purple',
        category: 'dispositivos',
        steps: [
            "En el reloj: Ajustes > General > Restablecer.",
            "Sigue las instrucciones en pantalla.",
            "Alternativa (Recovery): Mantener pulsados ambos botones hasta que aparezca 'Rebooting'. Pulsar botón Home repetidamente hasta menú. Elegir Recovery."
        ]
    },
    {
        id: 'airpods_reset',
        title: 'Reset AirPods (Fábrica)',
        icon: 'Headphones',
        color: 'slate',
        category: 'dispositivos',
        steps: [
            "Pon los AirPods en el estuche y cierra la tapa 30 seg.",
            "Abre la tapa. En iPhone: Ajustes > Bluetooth > 'i' > Omitir dispositivo.",
            "Con la tapa abierta, mantén pulsado el botón trasero del estuche.",
            "Espera (aprox 15s) hasta que la luz parpadee ámbar y luego blanco.",
            "Listo para enlazar de nuevo."
        ]
    },
    {
        id: 'airpods_icloud',
        title: 'Desvincular AirPods de iCloud',
        icon: 'Cloud',
        color: 'blue',
        category: 'dispositivos',
        steps: [
            "Si el cliente no hizo 'Omitir dispositivo', los AirPods seguirán vinculados a su Apple ID ('AirPods Mismatch').",
            "Pedir al cliente que vaya a la app 'Buscar' (Find My) en su iPhone.",
            "Pestaña 'Dispositivos' > Seleccionar los AirPods.",
            "Deslizar hacia arriba y tocar 'Eliminar este dispositivo'.",
            "Confirmar la eliminación. Solo así se libera el bloqueo de rastreo."
        ],
        warning: "Si esto no se hace, el nuevo dueño verá un aviso de 'AirPods Detected' y podrá ser rastreado."
    }
];

// AUTHENTICITY / COUNTERFEIT DETECTION GUIDES
export const AUTHENTICITY_GUIDES = [
    {
        id: 'airpods_pro_2_fake',
        title: 'Detectar Falsos: AirPods Pro 2',
        icon: 'AlertTriangle',
        color: 'red',
        model: 'AirPods Pro 2',
        checks: [
            {
                label: "Estuche: Altavoz y Lanyard",
                desc: "Los Pro 2 tienen agujeros de altavoz abajo y enganche lateral. Las copias malas no lo tienen. Las buenas sí, pero los agujeros suelen ser 'ciegos' (sin malla real) o el metal del enganche es plástico pintado."
            },
            {
                label: "Cancelación de Ruido (ANC)",
                desc: "La prueba definitiva. Al activar ANC, el silencio debe ser casi total (vacío). Las copias solo atenúan un poco o hacen ruido blanco."
            },
            {
                label: "Transparencia Adaptativa",
                desc: "Habla fuerte o da un golpe seco cerca. Los originales atenúan el pico de ruido instantáneamente. Las copias no reaccionan."
            },
            {
                label: "Búsqueda de Precisión",
                desc: "Solo con iPhone 11 o superior. En la app Buscar, debe aparecer la opción de 'Buscar Cerca' con la flecha verde de dirección y distancia exacta. Las copias solo muestran la ubicación en mapa."
            },
            {
                label: "Menú de Ajustes",
                desc: "Al conectar, deben aparecer en Ajustes > [Nombre AirPods]. Baja hasta el final. Debe mostrar Cobertura de Garantía válida (aunque las copias a veces roban seriales reales). Toca la versión de firmware: debe ser la última de Apple (ej. 5B58, 6A300... búscalo en Google)."
            }
        ]
    },
    {
        id: 'airpods_3_fake',
        title: 'Detectar Falsos: AirPods 3',
        icon: 'AlertTriangle',
        color: 'orange',
        model: 'AirPods 3',
        checks: [
            {
                label: "Sensores de Piel",
                desc: "El sensor en la parte interna es diferente al Pro. Es un sensor de detección de piel más alargado y oscuro. Las copias suelen usar un sensor óptico (negro brillante simple) o nada."
            },
            {
                label: "Audio Espacial",
                desc: "Ve a Ajustes > Bluetooth > Audio Espacial. Activa 'Seguimiento de Cabeza'. Mueve la cabeza. El sonido debe quedarse fijo en el iPhone. Si el sonido gira contigo, son falsos (o no tienen giroscopio)."
            },
            {
                label: "Calidad de Construcción",
                desc: "La bisagra del estuche original es de metal mate suave y no tiene holgura lateral. Las copias suelen tener bisagras brillantes, cromadas o con juego lateral al abrir."
            }
        ]
    },
    {
        id: 'airpods_pro_fake',
        title: 'Detectar Falsos: AirPods Pro 1',
        icon: 'AlertTriangle',
        color: 'yellow',
        model: 'AirPods Pro 1',
        checks: [
            {
                label: "Difusor Negro Exterior",
                desc: "La rejilla negra exterior es un micrófono real. En las copias baratas es una pegatina o plástico pintado. Intenta mirar con lupa o flash si hay profundidad."
            },
            {
                label: "Número de Serie Individual",
                desc: "Cada auricular (L y R) tiene su propio número de serie impreso debajo de la almohadilla, DIFERENTE al del estuche. Las copias suelen tener el MISMO serial en los 3 sitios (L, R, Estuche)."
            },
            {
                label: "Prueba de Almohadillas",
                desc: "Quita la goma. El conector original tiene un diseño ovalado muy específico con dos pequeños agujeros negros laterales y una malla blanca/negra densa. Las copias suelen tener un conector redondo genérico o una malla de mala calidad."
            }
        ]
    },
    {
        id: 'airpods_max_fake',
        title: 'Detectar Falsos: AirPods Max',
        icon: 'AlertTriangle',
        color: 'purple',
        model: 'AirPods Max',
        checks: [
            {
                label: "Corona Digital",
                desc: "La corona debe girar con una suavidad extrema y sin 'clics' mecánicos toscos. Al girarla debe controlar el volumen del iPhone con una fluidez perfecta."
            },
            {
                label: "Quitar Almohadillas",
                desc: "Son magnéticas. Al quitarlas, busca un agujero pequeño (como de SIM) en la parte superior del auricular (dentro). Se usa para desmontar la diadema. Las copias no suelen tener este nivel de ingeniería interna."
            },
            {
                label: "Peso y Materiales",
                desc: "El original pesa 384g. Se siente denso y frío (aluminio). Las copias suelen ser de plástico pintado y mucho más ligeras."
            }
        ]
    },
    {
        id: 'general_fake',
        title: 'Tips Generales Apple (Cables/Cajas)',
        icon: 'Box',
        color: 'slate',
        model: 'Generico',
        checks: [
            {
                label: "La Caja (Font)",
                desc: "Apple usa la fuente 'San Francisco'. Las copias suelen usar Arial o una fuente más delgada/gruesa. Fíjate en el espaciado de las letras (kerning) en 'Designed by Apple in California'."
            },
            {
                label: "Etiquetas de la Caja",
                desc: "Las etiquetas originales son 2 pegatinas separadas en la base. Las copias a veces imprimen el texto directamente en la caja o usan una sola etiqueta grande mal alineada."
            },
            {
                label: "Documentación",
                desc: "Los bordes de los papeles de instrucciones originales son redondeados. Las copias suelen tener esquinas cuadradas y papel de peor calidad/blanco azulado."
            },
            {
                label: "Cable Lightning/USB-C",
                desc: "El cable original tiene los contactos dorados/plateados perfectos y el plástico interno del conector es liso. Busca texto 'Designed by Apple...' muy tenue impreso a unos 15cm del conector USB. Las copias a veces lo tienen muy oscuro o con faltas de ortografía ('Califronia')."
            }
        ]
    }
];
