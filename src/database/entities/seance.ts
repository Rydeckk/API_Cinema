import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Salle } from "./salle"
import { Film } from "./film"

@Entity({ name : "Seance"})
export class Seance {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    capacite: number

    @Column({default : 0})
    nbPlacesPrises: number = 0

    @Column()
    type: string

    @CreateDateColumn({type: "datetime"})
    dateDebut: Date

    @CreateDateColumn({type: "datetime"})
    dateFin: Date

    @ManyToOne(() => Film, (film) => film.id, {onDelete: 'CASCADE'})
    film: Film

    @ManyToOne(() => Salle, (salle) => salle.id, {onDelete: 'CASCADE'})
    salle: Salle

    constructor(id:number,capacite: number, type: string, dateDebut: Date, dateFin: Date, film: Film, salle: Salle) {
        this.id = id,
        this.capacite = capacite,
        this.type = type,
        this.dateDebut = dateDebut,
        this.dateFin = dateFin,
        this.film = film,
        this.salle = salle
    }

}
