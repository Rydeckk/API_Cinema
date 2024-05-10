import Joi from "joi"

export interface createSalleRequest {
    name: string
    description: string
    images: string
    type: string,
    capacite: number,
    accessHandicap?: boolean,
    isMaintenance?: boolean
}

export const createSalleValidation = Joi.object<createSalleRequest>({
    name: Joi.string()
        .min(3)
        .required(),
    description: Joi.string()
        .required(),
    images: Joi.string()  
        .required(),
    type: Joi.string()
        .required(),
    capacite: Joi.number()
        .min(15)
        .max(30)
        .required(),
    accessHandicap: Joi.bool()
        .optional(),
    isMaintenance: Joi.bool()
        .optional(),
})

export interface GetSalleByIdRequest {
    id: number
}

export const getSalleByIdValidation = Joi.object<GetSalleByIdRequest>({
    id: Joi.number().required()
})

export interface GetSallesRequest {
    page?: number,
    limit?: number,
    accessHandicap?: boolean,
    isMaintenance?: boolean
}

export const getSallesValidation = Joi.object<GetSallesRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    accessHandicap: Joi.bool().optional(),
    isMaintenance: Joi.bool().optional()
})

export interface UpdateSalleRequest {
    id: number,
    name?: string,
    description?: string,
    images?: string,
    type?: string,
    capacite?: number,
    accessHandicap?: boolean,
    isMaintenance?: boolean
}

export const updateSalleValidation = Joi.object<UpdateSalleRequest>({
    id: Joi.number()
        .required(),
    name: Joi.string()
        .min(3)
        .optional(),
    description: Joi.string()
        .optional(),
    images: Joi.string()   
        .optional(),
    type: Joi.string()
        .optional(),
    capacite: Joi.number()
        .min(15)
        .max(30)
        .optional(),
    accessHandicap: Joi.bool()
        .optional(),
    isMaintenance: Joi.bool()
        .optional(),
})
