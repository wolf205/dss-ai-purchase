import { IUnitOfWork } from '../../application/ports/IUnitOfWork';
import { prisma } from './prisma';

export class PrismaUnitOfWork implements IUnitOfWork {
  public async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return prisma.$transaction(async () => {
      return await work();
    }, {
      maxWait: 5000, // 5s max wait to acquire connection
      timeout: 10000, // 10s max transaction runtime
    });
  }
}
