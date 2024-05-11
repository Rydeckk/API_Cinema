import Joi from "joi"

/**
 * @swagger
 * definitions:
 *   CreateSalleRequest:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         minLength: 3
 *         example: Salle 1
 *         required: true
 *       description:
 *         type: string
 *         example: Salle de cinéma avec son dolby atmos
 *         required: true
 *       images:
 *         type: string
 *         example: /path/to/image.jpg
 *         required: true
 *       type:
 *         type: string
 *         example: 3D
 *         required: true
 *       capacite:
 *         type: number
 *         minimum: 15
 *         maximum: 30
 *         example: 20
 *         required: true
 *       accessHandicap:
 *         type: boolean
 *         example: true
 *       isMaintenance:
 *         type: boolean
 *         example: false
 */
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

/**
 * @swagger
 * definitions:
 *   UpdateSalleRequest:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         minLength: 3
 *         example: Salle 1
 *       description:
 *         type: string
 *         example: Salle de cinéma avec son dolby atmos
 *       images:
 *         type: string
 *         example: /path/to/image.jpg
 *       type:
 *         type: string
 *         example: 4DX
 *       capacite:
 *         type: number
 *         minimum: 15
 *         maximum: 30
 *         example: 20
 *       accessHandicap:
 *         type: boolean
 *         example: true
 *       isMaintenance:
 *         type: boolean
 *         example: false
 */

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
