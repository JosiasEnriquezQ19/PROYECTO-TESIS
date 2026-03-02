const mysql = require('mysql2');

// console.log('DB Connection Config:');
// console.log('MYSQLHOST:', process.env.MYSQLHOST);
// console.log('MYSQLUSER:', process.env.MYSQLUSER);
// console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '***' : 'NOT SET');
// console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
// console.log('MYSQLPORT:', process.env.MYSQLPORT);

const pool = mysql.createPool({
    host: 'localhost',
    user: 'josias',
    password: '031506JR',
    database: 'DBVENTASDEMO',
    port: 3306,
    // Opciones de conexión para mejorar la estabilidad
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportar la conexión con promesas para trabajar con async/await
module.exports = pool.promise();