import { randomUUID } from 'node:crypto'
import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity()
export class ProductEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID()

  @Property()
  name!: string

  @Property()
  price!: number
}
