import { prisma } from '../database/prisma';
import { User, UserRole } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  public async findById(id: string): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { username },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { email },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findAll(options?: { isActive?: boolean; role?: string }): Promise<User[]> {
    const where: any = {};
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.role) {
      where.role = options.role as any;
    }

    const records = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  public async save(user: User): Promise<User> {
    const record = await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role as any,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
      },
    });
    return this.toDomain(record);
  }

  public async update(user: User): Promise<User> {
    const record = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role as any,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
      },
    });
    return this.toDomain(record);
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private toDomain(record: any): User {
    return new User({
      id: record.id,
      username: record.username,
      passwordHash: record.passwordHash,
      fullName: record.fullName,
      email: record.email,
      role: record.role as UserRole,
      isActive: record.isActive,
      mustChangePassword: record.mustChangePassword,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
