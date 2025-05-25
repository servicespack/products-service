import { knex } from 'knex'
import * as config from '../config/knexfile'

export abstract class KnexRepository {
  protected readonly knex: knex.Knex

  constructor() {
    this.knex = knex(config)
  }
}
