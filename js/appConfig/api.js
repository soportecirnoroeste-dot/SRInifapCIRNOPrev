const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a SQL Server
const dbConfig = {
    server: 'SERVIDORSRINIFA',
    options: {
        instanceName: 'EXP2012',
        database: 'PrevSRInifapCIRNO',
        trustedConnection: true,
        encrypt: false,
        trustServerCertificate: true
    }
};

// Pool de conexión global
let poolConnection;

async function conectarDB() {
    try {
        poolConnection = await sql.connect(dbConfig);
        console.log('¡Conexión exitosa a SQL Server (SERVIDORSRINIFA\\EXP2012) desde api.js!');
    } catch (err) {
        console.error('Error crítico al conectar con SQL Server:', err.message);
        process.exit(1);
    }
}

// Iniciar conexión y levantar servidor
conectarDB().then(() => {
    app.listen(PORT, () => {
        console.log(`API corriendo en http://localhost:${PORT}`);
    });
});

// ==========================================
// RUTAS DE LA API (Endpoints)
// ==========================================

/**
 * Ruta de prueba para verificar estado
 */
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API y Base de Datos operativos.' });
});

/**
 * Endpoint usando los nombres exactos de los campos en las tablas SQL
 */
app.get('/api/sistema/datos', async (req, res) => {
    try {
        const pool = await poolConnection;
        
        // 1. Consultamos SRIModulo con sus campos originales
        const queryModulos = pool.request().query(`
            SELECT SRIModId, SRIModNom, SRIModNomC 
            FROM dbo.SRIModulo
        `);

        // 2. Consultamos SRICnfMenu con sus campos originales
        const queryCnfMenu = pool.request().query(`
            SELECT SRIRegId, SRICenId, SRIModId 
            FROM dbo.SRICnfMenu
        `);

        // 3. Consultamos SRIRegion con sus campos originales
        const queryRegionales = pool.request().query(`
            SELECT SRIRegId, SRIRegNom, SRIRegNomC 
            FROM dbo.SRIRegion
        `);

        // 4. Consulta auxiliar para Sitios / Centros
        const querySitios = pool.request().query('SELECT * FROM dbo.SRISitio');

        // Ejecutamos todas las consultas en paralelo
        const [modulosRes, cnfMenuRes, regionalesRes, sitiosRes] = await Promise.all([
            queryModulos,
            queryCnfMenu,
            queryRegionales,
            querySitios
        ]);

        // Estructuramos la respuesta conservando los nombres de tus campos originales
        res.json({
            success: true,
            message: 'Datos del sistema obtenidos correctamente con campos nativos',
            data: {
                modulos: modulosRes.recordset.map(mod => {
                    const relCnf = cnfMenuRes.recordset.find(c => c.SRIModId === mod.SRIModId);
                    return {
                        ...mod,
                        SRIRegId: relCnf ? relCnf.SRIRegId : null,
                        SRICenId: relCnf ? relCnf.SRICenId : null
                    };
                }),
                regiones: regionalesRes.recordset,
                sitios: sitiosRes.recordset,
                configMenu: cnfMenuRes.recordset
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