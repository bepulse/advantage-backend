import { CreateUserAdminUseCase } from './create-user-admin';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { CognitoUserService } from '@/infrastructure/external/cognito-user.service';
import { User, UserRole } from '@prisma/client';
import HttpError from '@/shared/errors/http.error';
import { AuditContext } from '@/application/dto/audit-context.dto';

// Mock dependencies
const mockUserRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
} as unknown as jest.Mocked<IUserRepository>;

const mockCognitoUserService = {
  createUser: jest.fn(),
} as unknown as jest.Mocked<CognitoUserService>;

describe('CreateUserAdminUseCase', () => {
  let sut: CreateUserAdminUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    sut = new CreateUserAdminUseCase(mockUserRepository, mockCognitoUserService);
  });

  it('should create a user in Cognito and DB successfully', async () => {
    // Arrange
    const userEmail = 'test@example.com';
    const userRole = UserRole.ADMIN;
    const user: User = {
      email: userEmail,
      role: userRole,
    } as User;

    const auditContext: AuditContext = { userEmail: 'admin@example.com' };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockCognitoUserService.createUser.mockResolvedValue(undefined);
    mockUserRepository.save.mockResolvedValue({
      id: 'generated-id',
      email: userEmail,
      role: userRole,
      customerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLoginAt: null,
      createdBy: 'admin@example.com',
      updatedBy: null,
      subscriptionId: null
    });

    // Act
    const result = await sut.execute(user, auditContext);

    // Assert
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userEmail);
    expect(mockCognitoUserService.createUser).toHaveBeenCalledWith(userEmail);
    expect(mockUserRepository.save).toHaveBeenCalledWith(user, auditContext);
    expect(result).toEqual({
      id: 'generated-id',
      role: userRole,
      email: userEmail,
      customerId: null,
    });
  });

  it('should throw an error if user already exists in DB', async () => {
    // Arrange
    const userEmail = 'existing@example.com';
    const user: User = { email: userEmail, role: UserRole.CUSTOMER } as User;

    mockUserRepository.findByEmail.mockResolvedValue({ id: 'existing-id' } as User);

    // Act & Assert
    await expect(sut.execute(user)).rejects.toThrow(HttpError);
    await expect(sut.execute(user)).rejects.toThrow('User already exists');
    expect(mockCognitoUserService.createUser).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('should throw an error if Cognito creation fails', async () => {
    // Arrange
    const userEmail = 'fail@example.com';
    const user: User = { email: userEmail, role: UserRole.CUSTOMER } as User;

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockCognitoUserService.createUser.mockRejectedValue(new Error('Cognito error'));

    // Act & Assert
    await expect(sut.execute(user)).rejects.toThrow(HttpError);
    await expect(sut.execute(user)).rejects.toThrow('Failed to create user in Cognito');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('should default role to CUSTOMER if not provided', async () => {
    // Arrange
    const userEmail = 'default@example.com';
    const user: User = { email: userEmail } as User; // No role provided

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockCognitoUserService.createUser.mockResolvedValue(undefined);
    mockUserRepository.save.mockImplementation(async (u) => ({
      ...u,
      id: 'new-id',
      role: u.role, // Should be CUSTOMER
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      customerId: null,
      subscriptionId: null,
      lastLoginAt: null,
      createdBy: null,
      updatedBy: null
    }));

    // Act
    const result = await sut.execute(user);

    // Assert
    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(result.role).toBe(UserRole.CUSTOMER);
    expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      role: UserRole.CUSTOMER
    }), undefined);
  });
});
