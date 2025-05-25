import type { Knex } from 'knex'
import * as path from 'node:path'

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: 'dev.sqlite3',
  },
  migrations: {
    directory: path.join(__dirname, '..', 'migrations'),
  },
}

module.exports = config
