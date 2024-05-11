import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { Seance } from "./seance";

@Entity({ name: "Billet"})
export class Billet {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({default: 1})
    nbUtilisation: number = 1

    @Column({default: 1})
    type: number = 1

    @ManyToOne(() => User, (user) => user.id, {onDelete: 'CASCADE'})
    user: User

    @ManyToMany(() => Seance)
    @JoinTable()
    seances: Seance[]

    constructor(id: number,name: string, type: number, user: User,seances: Seance[]) {
        this.id = id,
        this.name = name,
        this.type = type,
        this.user = user,
        this.seances = seances
    }
}