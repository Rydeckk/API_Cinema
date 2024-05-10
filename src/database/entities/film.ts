import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Seance } from "./seance"

@Entity({ name: "Film"})
export class Film {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    duree: number

    @Column({default: false})
    isDisponible: boolean = false

    @OneToMany(() => Seance, (seance) => seance.film, {onDelete: 'CASCADE'}) 
    seances: Seance[]

    constructor(id: number,name: string, duree: number, isDisponible: boolean ,seances: Seance[]) {
        this.id = id,
        this.name = name,
        this.duree = duree,
        this.isDisponible, isDisponible,
        this.seances = seances
    }
}