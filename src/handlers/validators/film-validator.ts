import Joi from "joi"

/**
 * @swagger
 * definitions:
 *     CreateFilmRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           example: "Nom du film"
 *           required: true
 *         duree:
 *           type: integer
 *           example: 120
 *           required: true
 *         isDisponible:
 *           type: boolean
 *           example: true
 *           required: true
 */

export interface createFilmRequest {
    name: string,
    duree: number,
    isDisponible: boolean
}

export const createFilmValidation = Joi.object<createFilmRequest>({
    name: Joi.string()
        .min(3)
        .required(),
    duree: Joi.number()
        .required(),
    isDisponible: Joi.bool()
        .required()
})

export interface GetFilmByIdRequest {
    id: number
}

export const getFilmByIdValidation = Joi.object<GetFilmByIdRequest>({
    id: Joi.number().required()
})

export interface GetFilmsRequest {
    page?: number,
    limit?: number,
    isDisponible?: boolean
}

export const getFilmsValidation = Joi.object<GetFilmsRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    isDisponible: Joi.bool().optional()
})

/**
 * @swagger
 * definitions:
 *     UpdateFilmRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: L'ID du film à mettre à jour.
 *           example: 123
 *         name:
 *           type: string
 *           minLength: 3
 *           description: Le nouveau nom du film.
 *           example: "Nouveau nom"
 *         duree:
 *           type: integer
 *           description: La nouvelle durée du film (en minutes).
 *           example: 120
 *         isDisponible:
 *           type: boolean
 *           description: La disponibilité mise à jour du film.
 *           example: true
 */

export interface UpdateFilmRequest {
    id: number,
    name?: string,
    duree?: number,
    isDisponible?: boolean
}

export const updateFilmValidation = Joi.object<UpdateFilmRequest>({
    id: Joi.number()
        .required(),
    name: Joi.string()
        .min(3)
        .optional(),
    duree: Joi.number()
        .optional(),
    isDisponible: Joi.bool()
        .optional()
})
