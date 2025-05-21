import { hashPassword, checkPassword } from '../../utils/auth';

describe('Auth Utils', () => {
    describe('hashPassword', () => {
        test('debe generar un hash diferente al password original', async () => {
            // Arrange
            const password = 'password123';
            
            // Act
            const hashedPassword = await hashPassword(password);
            
            // Assert
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword).toHaveLength(60); // bcrypt genera hashes de 60 caracteres
        });
        
        test('debe generar hashes diferentes para el mismo password', async () => {
            // Arrange
            const password = 'password123';
            
            // Act
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);
            
            // Assert
            expect(hash1).not.toBe(hash2);
        });
    });
    
    describe('checkPassword', () => {
        test('debe retornar true para un password correcto', async () => {
            // Arrange
            const password = 'password123';
            const hashedPassword = await hashPassword(password);
            
            // Act
            const result = await checkPassword(password, hashedPassword);
            
            // Assert
            expect(result).toBe(true);
        });
        
        test('debe retornar false para un password incorrecto', async () => {
            // Arrange
            const password = 'password123';
            const wrongPassword = 'password1234';
            const hashedPassword = await hashPassword(password);
            
            // Act
            const result = await checkPassword(wrongPassword, hashedPassword);
            
            // Assert
            expect(result).toBe(false);
        });
    });
});