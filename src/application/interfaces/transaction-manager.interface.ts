export interface ITransactionManager {
  runInTransaction: <T>(work: () => Promise<T>) => Promise<T>
}
