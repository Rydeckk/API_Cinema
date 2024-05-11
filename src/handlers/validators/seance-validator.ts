import Joi from "joi"
import Moment, { max } from "moment"
import { Film } from "../../database/entities/film"
import { Salle } from "../../database/entities/salle"
import { Seance } from "../../database/entities/seance"

/**
 * @swagger
 * definitions:
 *   CreateSeanceRequest:
 *     type: object
 *     properties:
 *       type:
 *         type: string
 *         description: Le type de séance.
 *         example: "3D"
 *       dateDebut:
 *         type: string
 *         format: date-time
 *         description: La date et l'heure de début de la séance au format ISO 8601. La date doit correspondre à certaines conditions
 *         example: "2024-05-12T10:00:00Z"
 *       dateFin:
 *         type: string
 *         format: date-time
 *         description: La date et l'heure de fin de la séance au format ISO 8601. La date doit correspondre à certaines conditions
 *         example: "2024-05-12T12:00:00Z"
 *       filmId:
 *         type: integer
 *         description: L'ID du film associé à la séance.
 *         example: 123
 *       salleId:
 *         type: integer
 *         description: L'ID de la salle où se déroule la séance.
 *         example: 456
 */

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

/**
 * @swagger
 * definitions:
 *   UpdateSeanceRequest:
 *     type: object
 *     properties:
 *       filmId:
 *         type: integer
 *         description: L'ID du film associé à la séance (optionnel).
 *         example: 123
 *       salleId:
 *         type: integer
 *         description: L'ID de la salle associée à la séance (optionnel).
 *         example: 123
 *       nbPlacesPrises:
 *         type: integer
 *         description: Le nombre de places réservées pour la séance (optionnel).
 *         example: 50
 *       type:
 *         type: string
 *         description: Le type de séance (optionnel).
 *         example: "2D"
 *       dateDebut:
 *         type: date-time
 *         format: date-time
 *         description: La date et l'heure de début de la séance (optionnel).
 *         example: "2024-05-10T14:00:00Z"
 *       dateFin:
 *         type: date-time
 *         format: date-time
 *         description: La date et l'heure de fin de la séance (optionnel).
 *         example: "2024-05-10T16:00:00Z"
 */
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

/**
 * @swagger
 * definitions:
 *   ReservationSeanceRequest:
 *     type: object
 *     properties:
 *       billetId:
 *         type: integer
 *         description: L'ID du billet que l'utilisateur veut utilisé.
 *         example: 123
 */

export interface reservationSeanceRequest {
    id: number,
    billetId: number
}

export const reservationSeanceValidation = Joi.object<reservationSeanceRequest>({
    id: Joi.number().required(),
    billetId: Joi.number().required()
})