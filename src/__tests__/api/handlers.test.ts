import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cors from 'cors';
import router from '../../router';
import User from '../../models/User';
import { hashPassword } from '../../utils/auth';

const createTestApp = () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/', router);
    return app;
};

describe('API Handlers - Funcionalidades Críticas', () => {
    let mongoServer: MongoMemoryServer;
    let app: express.Application;

    beforeAll(async () => {
        // DESCONECTAR primero si ya está conectado
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Configurar MongoDB en memoria
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Configurar variables de entorno
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        
        // Conectar a MongoDB
        await mongoose.connect(mongoUri);
        
        // Crear app de test
        app = createTestApp();
    });

    afterEach(async () => {
        // Limpiar colecciones si están disponibles
        if (mongoose.connection.readyState === 1) {
            const collections = await mongoose.connection.db.collections();
            for (const collection of collections) {
                await collection.deleteMany({});
            }
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    describe('POST /auth/register', () => {
        test('debe crear usuario con datos válidos', async () => {
            const userData = {
                handle: 'testuser',
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.text).toBe('Registro Creado Correctamente');

            const savedUser = await User.findOne({ email: userData.email });
            expect(savedUser).toBeTruthy();
            expect(savedUser.handle).toBe('testuser');
        });

        test('debe rechazar email duplicado', async () => {
            await User.create({
                handle: 'existing',
                name: 'Existing User',
                email: 'existing@example.com',
                password: await hashPassword('password123')
            });

            const newUserData = {
                handle: 'newuser',
                name: 'New User',
                email: 'existing@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(newUserData);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Un usuario con ese mail ya esta registrado');
        });
    });

    describe('POST /auth/login', () => {
        test('debe autenticar con credenciales válidas', async () => {
            await User.create({
                handle: 'logintest',
                name: 'Login Test',
                email: 'login@example.com',
                password: await hashPassword('password123')
            });

            const loginData = {
                email: 'login@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
        });

        test('debe rechazar email inexistente', async () => {
            const loginData = {
                email: 'noexiste@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('El Usuario no existe');
        });
    });

    describe('GET /:handle', () => {
        test('debe devolver usuario por handle', async () => {
            await User.create({
                handle: 'publicuser',
                name: 'Public User',
                email: 'public@example.com',
                password: await hashPassword('password123'),
                description: 'Public description'
            });

            const response = await request(app)
                .get('/publicuser');

            expect(response.status).toBe(200);
            expect(response.body.handle).toBe('publicuser');
            expect(response.body.name).toBe('Public User');
            expect(response.body.email).toBeUndefined();
        });

        test('debe devolver 404 para handle inexistente', async () => {
            const response = await request(app)
                .get('/handleinexistente');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('El Usuario no existe');
        });
    });

    describe('POST /search', () => {
        test('debe confirmar handle disponible', async () => {
            const searchData = {
                handle: 'handledisponible'
            };

            const response = await request(app)
                .post('/search')
                .send(searchData);

            expect(response.status).toBe(200);
            expect(response.text).toBe('handledisponible está disponible');
        });

        test('debe rechazar handle ocupado', async () => {
            await User.create({
                handle: 'handleocupado',
                name: 'Occupied Handle',
                email: 'occupied@example.com',
                password: await hashPassword('password123')
            });

            const searchData = {
                handle: 'handleocupado'
            };

            const response = await request(app)
                .post('/search')
                .send(searchData);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('handleocupado ya está registrado');
        });
    });
});