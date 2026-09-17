import type { ITransactionManager } from '../../../application/interfaces/transaction-manager.interface'
import mongoose from 'mongoose'
import { transactionStorage } from './transaction.context'

export class MongooseTransactionManager implements ITransactionManager {
  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const session = await mongoose.startSession()
    try {
      let result!: T
      await session.withTransaction(async () => {
        result = await transactionStorage.run(session, work)
      })
      return result
    }
    finally {
      await session.endSession()
    }
  }
}
