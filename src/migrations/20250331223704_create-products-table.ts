import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('products', (table) => {
    table.string('id').primary()
    table.string('name').notNullable()
    table.string('description')
    table.decimal('price', 2).notNullable()
    table.check('price >= 0')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('products')
}
