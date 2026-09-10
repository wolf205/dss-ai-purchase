import { CreateUserUseCase } from './CreateUserUseCase';
import { UpdateUserUseCase } from './UpdateUserUseCase';
import { ListUsersUseCase } from './ListUsersUseCase';
import { ResetPasswordUseCase } from './ResetPasswordUseCase';
import { GetUserByIdUseCase } from './GetUserByIdUseCase';
import { UpdateUserStatusUseCase } from './UpdateUserStatusUseCase';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { ITokenBlacklistService } from '../../ports/ITokenBlacklistService';
import { UserResponseDTO } from '../../dtos/AuthDTO';

export class ManageUserUseCase {
  public readonly create: CreateUserUseCase;
  public readonly update: UpdateUserUseCase;
  public readonly list: ListUsersUseCase;
  public readonly resetPassword: ResetPasswordUseCase;
  public readonly getUserById: GetUserByIdUseCase;
  public readonly updateStatus: UpdateUserStatusUseCase;

  constructor(
    userRepository: IUserRepository,
    passwordHasher: IPasswordHasher,
    tokenBlacklistService?: ITokenBlacklistService,
    refreshTokenRepository?: IRefreshTokenRepository,
    auditLogRepository?: IAuditLogRepository
  ) {
    this.create = new CreateUserUseCase(userRepository, passwordHasher);
    this.update = new UpdateUserUseCase(userRepository, passwordHasher);
    this.list = new ListUsersUseCase(userRepository);
    this.resetPassword = new ResetPasswordUseCase(
      userRepository,
      passwordHasher,
      tokenBlacklistService,
      refreshTokenRepository,
      auditLogRepository
    );
    this.getUserById = new GetUserByIdUseCase(userRepository);
    this.updateStatus = new UpdateUserStatusUseCase(userRepository, tokenBlacklistService, refreshTokenRepository);
  }



  public async getById(userId: string): Promise<UserResponseDTO> {
    return await this.getUserById.execute(userId);
  }

  public async setStatus(
    userId: string,
    isActive: boolean,
    operatorUserId?: string
  ): Promise<UserResponseDTO> {
    return await this.updateStatus.execute(userId, isActive, operatorUserId);
  }
}

