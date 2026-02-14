export const ACCOUNT_REMOVAL_GUIDES = [
    {
        id: 'icloud',
        title: 'Apple iCloud',
        icon: 'Apple',
        color: 'gray',
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
        steps: [
            "Abre Ajustes > Cuentas / Usuarios y cuentas.",
            "Selecciona la cuenta de Google.",
            "Toca 'Quitar cuenta'.",
            "Si hay patrón/PIN, lo pedirá para confirmar.",
            "IMPORTANTE: Hacer esto ANTES de restablecer de fábrica para evitar bloqueo FRP."
        ]
    },
    {
        id: 'apple_watch',
        title: 'Desenlazar Apple Watch',
        icon: 'Watch',
        color: 'orange',
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
        steps: [
            "En el reloj: Ajustes > General > Restablecer.",
            "Sigue las instrucciones en pantalla.",
            "Alternativa (Recovery): Mantener pulsados ambos botones hasta que aparezca 'Rebooting'. Pulsar botón Home repetidamente hasta menú. Elegir Recovery."
        ]
    },
    {
        id: 'airpods',
        title: 'Reset AirPods',
        icon: 'Headphones',
        color: 'slate',
        steps: [
            "Pon los AirPods en el estuche y cierra la tapa 30 seg.",
            "Abre la tapa. En iPhone: Ajustes > Bluetooth > 'i' > Omitir dispositivo.",
            "Con la tapa abierta, mantén pulsado el botón trasero del estuche.",
            "Espera (aprox 15s) hasta que la luz parpadee ámbar y luego blanco.",
            "Listo para enlazar de nuevo."
        ]
    }
];
