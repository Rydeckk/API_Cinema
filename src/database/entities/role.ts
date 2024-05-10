import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity({name: "Role"})
export class Role {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({
        unique: true
    })
    type: string

    @OneToMany(() => User, user => user.id)
    users: User[];

    constructor(id: number, name: string, type: string, users: User[]) {
        this.id = id,
        this.name = name,
        this.type = type,
        this.users = users
    }
}