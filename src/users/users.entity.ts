import { AfterInsert, AfterRemove, AfterUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'user_type' })
  userType: 'clipper' | 'creator';

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @AfterInsert()
  logInsert() {
    console.log('Inserted User with id', this.id);
  }

  @AfterUpdate()
  logUpdate() {
    console.log('Updated User with id', this.id);
  }

  @AfterRemove()
  logRemove() {
    console.log('Removed User with id', this.id);
  }
}
