import Joi from "joi"

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
