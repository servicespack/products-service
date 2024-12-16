import { SqliteDriver, MikroORM as MikroORMSQLite } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { MikroORM } from '@mikro-orm/core';
import { ProductEntity } from '../entities/product.entity';

export class Database {
  public readonly orm: MikroORM

  constructor () {
    this.orm = MikroORMSQLite.initSync({
      driver: SqliteDriver,
      dbName: 'sqlite.db',
      entities: [ProductEntity],
      metadataProvider: TsMorphMetadataProvider,
      debug: true,
    })
  }
}

export const database = new Database()
