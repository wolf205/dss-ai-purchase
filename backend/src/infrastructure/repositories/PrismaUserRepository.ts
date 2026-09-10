import { getPrismaClient } from '../database/prisma';
import { User, UserRole } from '../../domain/entities/User';
import { IUserRepository, UserFilterOptions, UserListResult } from '../../domain/repositories/IUserRepository';
import { DuplicateResourceException } from '../../application/exceptions/DuplicateResourceException';
import { EntityNotFoundException } from '../../application/exceptions/EntityNotFoundException';

export class PrismaUserRepository implements IUserRepository {
  public async findById(id: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const record = await prisma.user.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const record = await prisma.user.findFirst({
      where: { username: { equals: username.trim(), mode: 'insensitive' } },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const normalizedEmail = email.trim().toLowerCase();
    const record = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  public async findAll(options?: UserFilterOptions): Promise<UserListResult> {
    const where: any = {};
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.role) {
      where.role = options.role as any;
    }
    if (options?.search && options.search.trim() !== '') {
      const q = options.search.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const prisma = getPrismaClient();
    const [records, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: records.map((r: any) => this.toDomain(r)),
      total,
    };
  }

  public async save(user: User): Promise<User> {
    const data: any = {
      username: user.username,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      email: user.email,
      role: user.role as any,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
    };
    if (user.id) {
      data.id = user.id;
    }

    const prisma = getPrismaClient();
    try {
      const record = await prisma.user.create({ data });
      return this.toDomain(record);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const target = Array.isArray(err.meta?.target) ? err.meta.target : [];
        if (target.includes('username') || err.message?.includes('username')) {
          throw new DuplicateResourceException('Tên đăng nhập', user.username);
        }
        if (target.includes('email') || err.message?.includes('email')) {
          throw new DuplicateResourceException('Email', user.email);
        }
        throw new DuplicateResourceException('Tên đăng nhập hoặc email', `${user.username} / ${user.email}`);
      }
      throw err;
    }
  }

  public async update(user: User): Promise<User> {
    if (!user.id) throw new Error('User ID is required for update');
    const prisma = getPrismaClient();
    try {
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
    } catch (err: any) {
      if (err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target) ? err.meta.target : [];
        if (target.includes('email') || err.message?.includes('email')) {
          throw new DuplicateResourceException('Email', user.email);
        }
        if (target.includes('username') || err.message?.includes('username')) {
          throw new DuplicateResourceException('Tên đăng nhập', user.username);
        }
        throw new DuplicateResourceException('Tên đăng nhập hoặc email', `${user.username} / ${user.email}`);
      }
      if (err.code === 'P2025') {
        throw new EntityNotFoundException('người dùng', user.id);
      }
      throw err;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const prisma = getPrismaClient();
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
