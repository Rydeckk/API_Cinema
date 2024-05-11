import Joi from "joi"
import Moment, { max } from "moment"
import { Film } from "../../database/entities/film"
import { Salle } from "../../database/entities/salle"
import { Seance } from "../../database/entities/seance"

export interface createSeanceRequestJSON {
    type: string,
    dateDebut: Date,
    dateFin: Date,
    filmId: number,
    salleId: number
}

export interface createSeanceRequest {
    capacite: number,
    type: string,
    dateDebut: Date,
    dateFin: Date,
    film: Film,
    salle: Salle
}

export interface verifErrorRequest {
    resultat: boolean,
    errorMessage: string
}

const dateDebutMin = new Date()
dateDebutMin.setHours(9,0,0,0)

const dateFinMax = new Date()
dateFinMax.setHours(20,0,0,0)

export const createSeanceValidation = Joi.object<createSeanceRequestJSON>({
    type: Joi.string()
        .required(),
    dateDebut: Joi.date()  
        .required()
        .iso(),
    dateFin: Joi.date()
        .required()
        .iso(),
    filmId: Joi.number()
        .required(),
    salleId: Joi.number()
        .required()
})

export function verifDateSeanceValide(dateDebut: Date, dateFin: Date): verifErrorRequest {
    const momentDateDebut = Moment(dateDebut)
    
    //verif jour ouvré (Lundi au vendredi)
    const jourSemaine = momentDateDebut.isoWeekday()
    if (jourSemaine < 1 || jourSemaine > 5) {
        return {resultat: false, errorMessage: "La séance doit être un jour ouvré compris entre Lundi et Vendredi"}
    }
    
    //Verif Seance même jour
    if (dateDebut.toLocaleDateString() !== dateDebut.toLocaleDateString()) {
        return {resultat: false, errorMessage: "La séance doit être le même jour"}
    }

    //Verif si les heures ne sont pas conformes (avant 9h ou après 20h)
    if (dateDebut.getHours() < 9) {
        return {resultat: false, errorMessage: "Les premières séeances débutent qu'à partir de 9h"}
    }

    if (dateFin.getHours() > 20 || (dateFin.getHours() === 20 && dateFin.getMinutes() > 0)) {
        return {resultat: false, errorMessage: "Les dernières séeances finissent à partir de 20h"}
    }
    return {resultat: true, errorMessage: ""}
}

export function verifDureeSeanceValide(filmFound: Film | null, dateDebut: Date, dateFin: Date): verifErrorRequest {
    if (filmFound?.duree) {
        const dureeMin = new Date(dateDebut)
        dureeMin.setMinutes(dureeMin.getMinutes() + filmFound?.duree + 30)

        if (dateFin < dureeMin ) {
            return {resultat: false, errorMessage: "La séance doit finir au minimum à " + dureeMin.getHours() + "H" + dureeMin.getMinutes() + " !"}
        }

        const dureeMax = new Date(dureeMin)
        dureeMax.setMinutes(dureeMax.getMinutes() + 30)
        if (dateFin > dureeMax) {
            return {resultat: false, errorMessage: "La séance doit finir au maximum à " + dureeMax.getHours() + "H" + dureeMax.getMinutes() + " !"}
        }
    }

    return {resultat: true, errorMessage: ""}
}

export function verifChevauchement(seances: Seance[], dateDebutSeance: Date, dateFinSeance: Date, typeChevauchement: string): verifErrorRequest {

    for(let i=0; i < seances.length; i++) {
        if((dateDebutSeance >= seances[i].dateDebut && dateFinSeance <= seances[i].dateFin)
        || (dateDebutSeance <= seances[i].dateFin && dateDebutSeance >= seances[i].dateDebut)
        || (dateFinSeance >= seances[i].dateDebut && dateFinSeance <= seances[i].dateFin)) {
            if (typeChevauchement === "Film") {
                return {resultat: false, errorMessage: "La séance pour ce film se chevauche avec une autre séance"}
            } else if (typeChevauchement === "Salle") {
                return {resultat: false, errorMessage: "La séance pour cette salle se chevauche avec une autre séance"}
            }
        }
    }
    
    return {resultat: true, errorMessage: ""}
}

export interface GetSeancesRequest {
    dateDebutInterval?: Date,
    dateFinInterval?: Date,
    page?: number
    limit?: number
}

export const getSeancesValidation = Joi.object<GetSeancesRequest>({
    dateDebutInterval: Joi.date().iso().optional(),
    dateFinInterval: Joi.date().iso().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional()
})

export interface GetSeancesSalleRequest {
    id: number,
    dateDebutInterval?: Date,
    dateFinInterval?: Date,
    page?: number
    limit?: number
}

export const getSeancesSalleValidation = Joi.object<GetSeancesSalleRequest>({
    id: Joi.number().required(),
    dateDebutInterval: Joi.date().iso().optional(),
    dateFinInterval: Joi.date().iso().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional()
})

export interface GetSeancesFilmRequest {
    id: number,
    dateDebutInterval?: Date,
    dateFinInterval?: Date,
    page?: number
    limit?: number
}

export const getSeancesFilmValidation = Joi.object<GetSeancesFilmRequest>({
    id: Joi.number().required(),
    dateDebutInterval: Joi.date().iso().optional(),
    dateFinInterval: Joi.date().iso().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional()
})

export interface UpdateSeanceRequestJSON {
    id: number,
    nbPlacesPrises?: number,
    type?: string,
    dateDebut?: Date,
    dateFin?: Date,
    filmId?: number,
    salleId?: number
}

export interface UpdateSeanceRequest {
    id: number,
    nbPlacesPrises?: number,
    type?: string,
    dateDebut: Date,
    dateFin: Date,
    film: Film,
    salle: Salle,
}

export const updateSeanceValidation = Joi.object<UpdateSeanceRequestJSON>({
    id: Joi.number().required(),
    nbPlacesPrises: Joi.number().optional(),
    type: Joi.string().optional(),
    dateDebut: Joi.date().iso().optional(),
    dateFin: Joi.date().iso().optional(),
    filmId: Joi.number().optional(),
    salleId: Joi.number().optional()
})

export interface GetSeanceByIdRequest {
    id: number
}

export const getSeanceByIdValidation = Joi.object<GetSeanceByIdRequest>({
    id: Joi.number().required()
})

export interface reservationSeanceRequest {
    id: number,
    billetId: number
}

export const reservationSeanceValidation = Joi.object<reservationSeanceRequest>({
    id: Joi.number().required(),
    billetId: Joi.number().required()
})