const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a SQL Server basada en tus propiedades actuales
const dbConfig = {
    server: 'SERVIDORSRINIFA', // Nombre de tu equipo
    options: {
        instanceName: 'EXP2012', // Instancia SQL Express
        database: 'PrevSRInifapCIRNO',      // Cambia 'master' por la base de datos de tu sistema (ej: PrevSRINifapCIRNO)
        trustedConnection: true, // Utiliza Autenticación de Windows
        encrypt: false,          // Falso para entornos locales de desarrollo
        trustServerCertificate: true
    }
};

// Pool de conexión global
let poolConnection;

async function conectarDB() {
    try {
        poolConnection = await sql.connect(dbConfig);
        console.log('¡Conexión exitosa a SQL Server (SERVIDORSRINIFA\\EXP2012)!');
    } catch (err) {
        console.error('Error crítico al conectar con SQL Server:', err.message);
        process.exit(1);
    }
}

// Iniciar conexión y levantar servidor
conectarDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor API corriendo en http://localhost:${PORT}`);
    });
});

// ==========================================
// RUTAS DE LA API (Endpoints)
// ==========================================

/**
 * Ruta de prueba para verificar estado
 */
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Servidor y Base de Datos operativos.' });
});

/**
 * Ejemplo de Endpoint para obtener datos del sistema
 * (Adapta esta consulta a las tablas reales de tu base de datos SQL)
 */
app.get('/api/sistema/datos', async (req, res) => {
    try {
        const pool = await poolConnection;
        
        // Ejemplo de consulta genérica para extraer información de catálogos
        // Modifica esto por tus tablas reales (ej: SELECT * FROM Departamentos)
        const resultadoDeptos = await pool.request().query('SELECT * FROM sys.tables');

        res.json({
            success: true,
            message: 'Datos del sistema obtenidos correctamente',
            data: {
                tablasSistema: resultadoDeptos.recordset,
                servidor: 'SERVIDORSRINIFA\\EXP2012'
            }
        });
    } catch (err) {
        console.error('Error en consulta SQL:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error interno en el servidor al consultar la base de datos',
            error: err.message
        });
    }
});