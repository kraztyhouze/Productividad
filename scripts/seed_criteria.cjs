const { pool } = require('./server/db');

async function main() {
    const criteria = [
        ['Higiene y Apariencia', 'Uniforme Correcto', 'Uso de la camiseta limpia, afeitado/maquillaje profesional.', 1],
        ['Higiene y Apariencia', 'Cuidado de Manos', 'Uso de guantes si es necesario, manos impecables para atender.', 2],
        ['Atención al Cliente', 'Protocolo de Bienvenida', 'Sonrisa, contacto visual y saludo profesional.', 3],
        ['Atención al Cliente', 'Detección de Necesidades', 'Capacidad para realizar preguntas abiertas y asesorar.', 4],
        ['Productividad y Técnica', 'Ritmo de Trabajo', 'Capacidad para atender con agilidad sin perder precisión.', 5],
        ['Productividad y Técnica', 'Uso de Herramientas', 'Dominio de la calculadora y sistema de compras.', 6],
        ['Compañerismo', 'Puntualidad y Turnos', 'Respeto a las horas de entrada y relevos.', 7],
        ['Compañerismo', 'Ambiente de Trabajo', 'Colaboración positiva con el resto del equipo.', 8]
    ];

    try {
        for (const [cat, title, desc, idx] of criteria) {
            await pool.query(
                'INSERT INTO evaluation_criteria (category, title, description, order_index) VALUES ($1, $2, $3, $4)', 
                [cat, title, desc, idx]
            );
        }
        console.log('Criteria inserted successfully');
    } catch (err) {
        console.error('Error inserting criteria:', err);
    } finally {
        await pool.end();
    }
}

main();
