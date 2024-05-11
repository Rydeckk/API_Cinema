import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity({name: "Role"})
export class Role {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({default: false})
    isAdmin: boolean

    @OneToMany(() => User, user => user.id)
    users: User[];

    constructor(id: number, name: string, isAdmin: boolean, users: User[]) {
        this.id = id,
        this.name = name,
        this.isAdmin = isAdmin,
        this.users = users
    }
}