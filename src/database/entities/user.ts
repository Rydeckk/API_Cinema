import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from "typeorm"
import { Token } from "./token"
import { Role } from "./role"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        unique: true
    })
    email: string

    @Column()
    password: string

    @CreateDateColumn({type: "datetime"})
    createdAt: Date

    @OneToMany(() => Token, token => token.user)
    tokens: Token[];

    @ManyToOne(() => Role, role => role.id)
    role: Role

    constructor(id: number, email: string, password: string, createdAt: Date, tokens: Token[], role: Role) {
        this.id = id,
        this.email = email,
        this.password = password,
        this.createdAt = createdAt,
        this.tokens = tokens,
        this.role = role
    }
}