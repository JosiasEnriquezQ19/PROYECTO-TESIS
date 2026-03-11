const request = require('supertest');
const express = require('express');
const loginRoutes = require('../../src/rutas/loginRoutes');

// Para probar rutas con Supertest cuando el app.js original ya tiene app.listen() y middleware complejo,
// una buena práctica para pruebas unitarias de rutas es crear una instancia de express simulada.
const app = express();

// Configurar middlewares básicos necesarios para la ruta
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Montar las rutas que queremos probar
app.use('/', loginRoutes);

// Mockear el controlador para no depender de la base de datos en esta prueba
jest.mock('../../src/controladores/loginController', () => ({
    mostrarLogin: (req, res) => res.status(200).send('Página de Login Simulada'),
    procesarLogin: (req, res) => {
        const { email, password } = req.body;
        if (email === 'test@admin.com' && password === '123') {
            return res.status(302).redirect('/dashboard');
        }
        return res.status(401).send('Credenciales incorrectas');
    },
    cerrarSesion: (req, res) => res.status(302).redirect('/login')
}));

describe('Login Routes', () => {
    describe('GET /', () => {
        it('debe redirigir a /login', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/login');
        });
    });

    describe('GET /login', () => {
        it('debe responder con estado 200 llamando a mostrarLogin', async () => {
            const response = await request(app).get('/login');
            expect(response.status).toBe(200);
            expect(response.text).toBe('Página de Login Simulada');
        });
    });

    describe('POST /login', () => {
        it('debe redirigir si las credenciales son correctas', async () => {
            const response = await request(app)
                .post('/login')
                .send({ email: 'test@admin.com', password: '123' });
            
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/dashboard');
        });

        it('debe devolver 401 si las credenciales son incorrectas', async () => {
            const response = await request(app)
                .post('/login')
                .send({ email: 'wrong@admin.com', password: 'wrong' });
            
            expect(response.status).toBe(401);
            expect(response.text).toBe('Credenciales incorrectas');
        });
    });

    describe('GET /logout', () => {
        it('debe redirigir a /login', async () => {
            const response = await request(app).get('/logout');
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/login');
        });
    });
});
