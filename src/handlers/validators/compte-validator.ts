import Joi from "joi"

export interface GetCompteRequest {
    id: number
}

export const getCompteValidation = Joi.object<GetCompteRequest>({
    id: Joi.number().required()
})

/**
 * @swagger
* definitions:
*  UpdateCompteRequest:
*    type: object
*    properties:
*      id:
*        type: integer
*        description: L'ID du compte.
*        example: 123
*      montant:
*        type: number
*        description: Le montant à déposer sur le compte.
*        example: 100
*    required:
*      - id
*      - montant
*/

export interface UpdateCompteRequest {
    id: number,
    montant: number
}

export const updateCompteValidation = Joi.object<UpdateCompteRequest>({
    id: Joi.number()
        .required(),
    montant: Joi.number()
        .required(),
})
