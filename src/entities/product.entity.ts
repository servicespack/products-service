import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { randomUUID } from 'node:crypto'

@Entity()
export class ProductEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property()
  name!: string;

  @Property()
  price!: number;
}
