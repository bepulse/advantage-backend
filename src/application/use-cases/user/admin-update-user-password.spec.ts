import { AdminUpdateUserPasswordUseCase } from './admin-update-user-password';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { CognitoUserService } from '@/infrastructure/external/cognito-user.service';
import { User, UserRole } from '@prisma/client';
import HttpError from '@/shared/errors/http.error';
import { AdminUpdateUserPasswordRequest } from '@/application/dto/admin-update-user-password.dto';

// Mock dependencies
const mockUserRepository = {
  findByEmail: jest.fn(),
} as unknown as jest.Mocked<IUserRepository>;

const mockCognitoUserService = {
  setUserPassword: jest.fn(),
} as unknown as jest.Mocked<CognitoUserService>;

describe('AdminUpdateUserPasswordUseCase', () => {
  let sut: AdminUpdateUserPasswordUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    sut = new AdminUpdateUserPasswordUseCase(mockUserRepository, mockCognitoUserService);
  });

  it('should update user password in Cognito successfully', async () => {
    // Arrange
    const request: AdminUpdateUserPasswordRequest = {
      email: 'test@example.com',
      password: 'NewPassword123!',
    };

    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: request.email,
      role: UserRole.CUSTOMER,
    } as User);

    mockCognitoUserService.setUserPassword.mockResolvedValue(undefined);

    // Act
    await sut.execute(request);

    // Assert
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
    expect(mockCognitoUserService.setUserPassword).toHaveBeenCalledWith(request.email, request.password);
  });

  it('should throw an error if user not found in DB', async () => {
    // Arrange
    const request: AdminUpdateUserPasswordRequest = {
      email: 'notfound@example.com',
      password: 'NewPassword123!',
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(request)).rejects.toThrow(HttpError);
    await expect(sut.execute(request)).rejects.toThrow('User not found in database');
    expect(mockCognitoUserService.setUserPassword).not.toHaveBeenCalled();
  });

  it('should throw an error if Cognito update fails', async () => {
    // Arrange
    const request: AdminUpdateUserPasswordRequest = {
      email: 'error@example.com',
      password: 'NewPassword123!',
    };

    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: request.email,
    } as User);

    mockCognitoUserService.setUserPassword.mockRejectedValue(new Error('Cognito error'));

    // Act & Assert
    await expect(sut.execute(request)).rejects.toThrow(HttpError);
    await expect(sut.execute(request)).rejects.toThrow('Failed to update user password in Cognito');
  });
});
