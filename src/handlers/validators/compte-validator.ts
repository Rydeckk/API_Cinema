import Joi from "joi"

export interface GetCompteRequest {
    id: number
}

export const getCompteValidation = Joi.object<GetCompteRequest>({
    id: Joi.number().required()
})

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
