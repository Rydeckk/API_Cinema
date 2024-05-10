import { DataSource } from "typeorm";
import { Seance } from "../database/entities/seance"
import { Salle } from "../database/entities/salle";
import { Film } from "../database/entities/film";

export interface ListSeanceFilter {
    dateDebutInterval?: Date,
    dateFinInterval?: Date,
    page: number,
    limit: number
}

export interface UpdateSeanceParams {
    nbPlacesPrises?: number
    type?: string
    dateDebut?: Date
    dateFin?: Date
    film?: Film
    salle?: Salle
}

export class SeanceUseCase {
    constructor(private readonly db: DataSource) { }

    async getSeanceById(id: number): Promise<Seance | null> {
        const query = this.db.createQueryBuilder(Seance, 'seance')
        query.innerJoinAndSelect('seance.film', 'film')
        query.innerJoinAndSelect('seance.salle', 'salle')
        query.where('seance.id= :seanceId', {seanceId: id})
        const seanceFound = await query.getOne()
        if (seanceFound === null) return null

        return seanceFound
    }

    async getSeanceByFilm(filmId: number,seanceId?: number): Promise<{seances:Seance[]}> {
        
        const query = this.db.createQueryBuilder(Seance, 'seance')
        query.innerJoinAndSelect('seance.film', 'film')
        query.where('seance.filmId= :filmId', {filmId: filmId})
        if (seanceId) {
            query.andWhere('seance.id <> :seanceId', {seanceId: seanceId})
        }

        const seances = await query.getMany()
        return {
            seances
        }
    }

    async getSeanceBySalle(salleId: number, seanceId?: number): Promise<{seances: Seance[]}> {
        const query = this.db.createQueryBuilder(Seance, 'seance')
        query.innerJoinAndSelect('seance.salle', 'salle')
        query.where('seance.salleId= :salleId', {salleId: salleId})
        if (seanceId) {
            query.andWhere('seance.id <> :seanceId', {seanceId: seanceId})
        }

        const seances = await query.getMany()
        return {
            seances
        }
    }

    async getListSeance(listSeanceFilter: ListSeanceFilter): Promise<{ seances: Seance[] }> {
        const query = this.db.createQueryBuilder(Seance, 'seance')
        query.skip((listSeanceFilter.page - 1) * listSeanceFilter.limit)
        query.take(listSeanceFilter.limit)
        query.innerJoinAndSelect('seance.film', 'film')
        query.innerJoinAndSelect('seance.salle', 'salle')
        query.where("salle.isMaintenance = 0")
        if(listSeanceFilter.dateDebutInterval) {
            query.andWhere("seance.dateDebut >= :dateDebut", {dateDebut: listSeanceFilter.dateDebutInterval})
        }
        if(listSeanceFilter.dateFinInterval) {
            query.andWhere("seance.dateFin <= :dateFin", {dateFin: listSeanceFilter.dateFinInterval})
        }

        const seances = await query.getMany()
        return {
            seances
        }
    }

    async getListSeanceSalle(id: number, listSeanceFilter: ListSeanceFilter): Promise<{ seances: Seance[] }> {
        const query = this.db.createQueryBuilder(Seance, 'seance')
        query.skip((listSeanceFilter.page - 1) * listSeanceFilter.limit)
        query.take(listSeanceFilter.limit)
        query.innerJoinAndSelect('seance.film', 'film')
        query.innerJoinAndSelect('seance.salle', 'salle')
        query.where("salle.isMaintenance = 0")
        query.andWhere("salle.id = :idSalle", {idSalle: id})
        if(listSeanceFilter.dateDebutInterval) {
            query.andWhere("seance.dateDebut >= :dateDebut", {dateDebut: listSeanceFilter.dateDebutInterval})
        }
        if(listSeanceFilter.dateFinInterval) {
            query.andWhere("seance.dateFin <= :dateFin", {dateFin: listSeanceFilter.dateFinInterval})
        }

        const seances = await query.getMany()
        return {
            seances
        }
    }

    async getListSeanceFilm(id: number, listSeanceFilter: ListSeanceFilter): Promise<{ seances: Seance[] }> {
        const query = this.db.createQueryBuilder(Seance, 'seance')
        query.skip((listSeanceFilter.page - 1) * listSeanceFilter.limit)
        query.take(listSeanceFilter.limit)
        query.innerJoinAndSelect('seance.film', 'film')
        query.innerJoinAndSelect('seance.salle', 'salle')
        query.where("salle.isMaintenance = 0")
        query.andWhere("film.id = :idFilm", {idFilm: id})
        if(listSeanceFilter.dateDebutInterval) {
            query.andWhere("seance.dateDebut >= :dateDebut", {dateDebut: listSeanceFilter.dateDebutInterval})
        }
        if(listSeanceFilter.dateFinInterval) {
            query.andWhere("seance.dateFin <= :dateFin", {dateFin: listSeanceFilter.dateFinInterval})
        }

        const seances = await query.getMany()
        return {
            seances
        }
    }

    async updateSeance(id: number, seanceParams: UpdateSeanceParams): Promise<Seance | null> {
        const repo = this.db.getRepository(Seance)
        const seancefound = await repo.findOneBy({ id })
        if (seancefound === null) return null

        if (seanceParams.dateDebut) {
            seancefound.dateDebut = seanceParams.dateDebut
        }

        if (seanceParams.dateFin) {
            seancefound.dateFin = seanceParams.dateFin
        }

        if (seanceParams.type) {
            seancefound.type = seanceParams.type
        }

        if (seanceParams.nbPlacesPrises) {
            seancefound.nbPlacesPrises = seanceParams.nbPlacesPrises
        }

        if (seanceParams.film) {
            seancefound.film = seanceParams.film
        }

        if (seanceParams.salle) {
            seancefound.salle = seanceParams.salle
            seancefound.capacite = seanceParams.salle.capacite
        }

        const seanceUpdate = await repo.save(seancefound)
        return seanceUpdate
    }

    async deleteSeance(id: number | undefined): Promise<Seance | null> {
        const repo = this.db.getRepository(Seance)
        const seancefound = await repo.findOneBy({ id })
        if (seancefound === null) return null

        repo.delete({ id })
        return seancefound
    }
}