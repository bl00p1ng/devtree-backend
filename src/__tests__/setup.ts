import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuración del entorno de pruebas
dotenv.config({ path: '.env.test' });

// Variable para almacenar la instancia de MongoDB en memoria
let mongoServer: MongoMemoryServer;

// Se ejecuta antes de todas las pruebas
beforeAll(async () => {
    // Crear una instancia de MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Establecer variables de entorno para pruebas
    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    // Conectar a la base de datos en memoria
    await mongoose.connect(mongoUri);
});

// Se ejecuta después de cada prueba
afterEach(async () => {
    // Limpiar todas las colecciones después de cada prueba
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
    }
});

// Se ejecuta después de todas las pruebas
afterAll(async () => {
    // Cerrar la conexión a la base de datos y detener el servidor MongoDB
    await mongoose.connection.close();
    await mongoServer.stop();
});

// Mock de Cloudinary para evitar llamadas reales durante las pruebas
jest.mock('../config/cloudinary', () => ({
    uploader: {
        upload: jest.fn((path, options, callback) => {
            callback(null, { secure_url: 'https://test-image-url.com/test.jpg' });
        }),
    },
}));

// Mock de JWT para pruebas
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'test-token'),
    verify: jest.fn((token) => {
        if (token === 'valid-token') {
            return { id: 'valid-user-id' };
        }
        throw new Error('Invalid token');
    }),
}));