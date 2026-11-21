import 'reflect-metadata'
import { Column, Entity, PrimaryColumn } from '#typeorm-under-test'

@Entity({ name: 'person' })
export class Person {
  @PrimaryColumn()
  id!: number

  @Column()
  first_name!: string
}

console.log('loaded')
