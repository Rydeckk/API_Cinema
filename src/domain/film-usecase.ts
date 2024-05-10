import { DataSource } from "typeorm";
import { Film } from "../database/entities/film";

export interface UpdateFilmParams {
    name?: string,
    duree?: number,
    isDisponible?: boolean
}

export interface ListFilmFilter {
    limit: number,
    page: number,
    isDisponible?: boolean
}

export class FilmUseCase {
    constructor(private readonly db: DataSource) { }

    async getFilm(id: number): Promise<Film | null> {
        const repo = this.db.getRepository(Film)
        const filmFound = await repo.findOneBy({ id })
        if (filmFound === null) return null

        return filmFound
    }

    async getListFilms(listFilmFilter: ListFilmFilter): Promise<{ films: Film[]; }> {
        const query = this.db.createQueryBuilder(Film, 'film')
        query.skip((listFilmFilter.page - 1) * listFilmFilter.limit)
        query.take(listFilmFilter.limit)

        if(listFilmFilter.isDisponible !== undefined) {
            query.andWhere("film.isDisponible = :isDisponible", {isDisponible: listFilmFilter.isDisponible})
        }
        const films = await query.getMany()
        return {
            films
        }
    }

    async updateFilm(id: number | undefined, filmParams: UpdateFilmParams): Promise<Film | null> {
        const repo = this.db.getRepository(Film)
        const filmfound = await repo.findOneBy({ id })
        if (filmfound === null) return null

        if (filmParams.duree) {
            filmfound.duree = filmParams.duree
        }

        if(filmParams.name) {
            filmfound.name = filmParams.name
        }

        if(filmParams.isDisponible !== undefined) {
            filmfound.isDisponible = filmParams.isDisponible
        }

        const filmUpdate = await repo.save(filmfound)
        return filmUpdate
    }

    async deleteFilm(id: number): Promise<Film | null> {
        const repo = this.db.getRepository(Film)
        const filmfound = await repo.findOneBy({ id })
        if (filmfound === null) return null

        repo.delete({ id })
        return filmfound
    }

}