export interface IUnitOfWork {
  executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
