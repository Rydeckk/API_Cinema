import express, { Request, Response } from "express";
import { createSalleValidation, getSalleByIdValidation, getSallesValidation, updateSalleValidation } from "./validators/salle-validator";
import { generateValidationErrorMessage } from "./validators/generate-validation-messages";
import { AppDataSource } from "../database/database";
import { Salle } from "../database/entities/salle";
import { SalleUseCase } from "../domain/salle-usecase";
import { createSeanceRequest, createSeanceValidation, getSeanceByIdValidation, getSeancesFilmValidation, getSeancesSalleValidation, getSeancesValidation, reservationSeanceValidation, UpdateSeanceRequest, updateSeanceValidation, verifChevauchement, verifDateSeanceValide, verifDureeSeanceValide, verifErrorRequest } from "./validators/seance-validator";
import { Seance } from "../database/entities/seance";
import { FilmUseCase } from "../domain/film-usecase";
import { Film } from "../database/entities/film";
import { createFilmValidation, getFilmByIdValidation, getFilmsValidation, updateFilmValidation } from "./validators/film-validator";
import { SeanceUseCase } from "../domain/seance-usecase";
import { authMiddleware, authMiddlewareAdmin } from "./middleware/auth-middleware";
import { createRoleValidation, getRoleByIdValidation, getRolesValidation, updateRoleValidation } from "./validators/role-validator";
import { Role } from "../database/entities/role";
import { RoleUseCase } from "../domain/role-usecase";
import { getUserByIdValidation, getUsersValidation } from "./validators/user-validator";
import { UserUseCase } from "../domain/user-usecase";
import { createBilletValidation, getBilletsValidation } from "./validators/billet-validator";
import { Billet } from "../database/entities/billet";
import { CompteUseCase } from "../domain/compte-usecase";
import { BilletUseCase } from "../domain/billet-usecase";
import { Compte } from "../database/entities/compte";
import { CompteTransaction } from "../database/entities/transaction";
import { getCompteValidation, updateCompteValidation } from "./validators/compte-validator";
import { getTransactionsValidation } from "./validators/transactions-validator";
import { TransactionUseCase } from "../domain/transaction-usecase";
import { UserHandler } from "./user";

export const initRoutes = (app: express.Express) => {

    //#region Routes salle
    /**
 * @swagger
 * /salle:
 *   post:
 *     summary: Créer une nouvelle salle.
 *     description: Crée une nouvelle salle en utilisant les données fournies dans le corps de la requête.
 *     tags:
 *       - Salle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données de la salle à créer.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateSalleRequest'
 *     responses:
 *       '201':
 *         description: Salle créée avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.post("/salle",authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = createSalleValidation.validate(req.body)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const createSalleRequest = validation.value
        const salleRepo = AppDataSource.getRepository(Salle)
        try {

            const salleCreated = await salleRepo.save(
                createSalleRequest
            )
            res.status(201).send(salleCreated)
        } catch (error) {
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /salle/{id}:
 *   get:
 *     summary: Obtenir une salle par ID.
 *     description: Récupère les informations d'une salle spécifique en utilisant son identifiant.
 *     tags:
 *       - Salle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la salle à récupérer.
 *         required: true
 *         schema:
 *           type: string
 *         example: 123
 *     responses:
 *       '200':
 *         description: Succès de la requête. Retourne les informations de la salle demandée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '404':
 *         description: La salle avec l'ID spécifié n'a pas été trouvée.
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.get("/salle/:id",authMiddleware ,async (req: Request, res: Response) => {
        const validation = getSalleByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getSalleRequest = validation.value

        try {
            const salleUseCase = new SalleUseCase(AppDataSource)
            const selectedSalle = await salleUseCase.getSalle(getSalleRequest.id)
            if (selectedSalle === null) {
                res.status(404).send({"error": `salle ${getSalleRequest.id} not found`})
                return
            }
            res.status(200).send(selectedSalle)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    /**
 * @swagger
 * /salle:
 *   get:
 *     summary: Obtenir une liste de salles.
 *     description: Récupère une liste de salles en fonction des filtres fournis.
 *     tags:
 *       - Salle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de résultats retournés.
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: page
 *         description: Numéro de la page pour la pagination.
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: accessHandicap
 *         description: Permet de filtrer sur les salles à accès handicapé
 *         schema:
 *           type: boolean
 *         example: true
 *       - in: query
 *         name: isMaintenance
 *         description: Permet de filtrer sur les salles qui sont en maintenance
 *         schema:
 *           type: boolean
 *         example: false
 *     responses:
 *       '200':
 *         description: Succès de la requête. Retourne une liste de salles.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.get("/salle", authMiddleware ,async (req: Request, res: Response) => {
        const validation = getSallesValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listSallesRequest = validation.value
        let limit = 20
        if (listSallesRequest.limit) {
            limit = listSallesRequest.limit
        }
        const page = listSallesRequest.page ?? 1

        try {
            const salleUseCase = new SalleUseCase(AppDataSource)
            const selectedSalle = await salleUseCase.getListSalle({ ...listSallesRequest, page, limit })
            res.status(200).send(selectedSalle)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /salle/{id}:
 *   patch:
 *     summary: Mettre à jour une salle par ID.
 *     description: Met à jour les informations d'une salle spécifique en utilisant son identifiant.
 *     tags:
 *       - Salle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la salle à mettre à jour.
 *         schema:
 *           type: string
 *         example: 123
 *     requestBody:
 *       description: Nouvelles informations à mettre à jour pour la salle.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateSalleRequest'
 *     responses:
 *       '200':
 *         description: Succès de la requête. Retourne les informations de la salle mise à jour.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '404':
 *         description: La salle avec l'ID spécifié n'a pas été trouvée.
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.patch("/salle/:id",authMiddlewareAdmin ,async (req: Request, res: Response) => {

        const validation = updateSalleValidation.validate({...req.params, ...req.body})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const updateSalleRequest = validation.value

        try {
            const salleUsecase = new SalleUseCase(AppDataSource);
            const updatedSalle = await salleUsecase.updateSalle(updateSalleRequest.id, { ...updateSalleRequest })
            if (updatedSalle === null) {
                res.status(404).send({"error": `salle ${updateSalleRequest.id} not found`})
                return
            }
            res.status(200).send(updatedSalle)
        } catch (error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /salle/{id}:
 *   delete:
 *     summary: Supprimer une salle par ID.
 *     description: Supprime une salle spécifique en utilisant son identifiant.
 *     tags:
 *       - Salle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la salle à supprimer.
 *         required: true
 *         schema:
 *           type: string
 *         example: 123
 *     responses:
 *       '200':
 *         description: Succès de la requête. Retourne un message indiquant la suppression de la salle.
 *       '404':
 *         description: La salle avec l'ID spécifié n'a pas été trouvée.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.delete("/salle/:id",authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = getSalleByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getSalleRequest = validation.value

        try {
            const salleUseCase = new SalleUseCase(AppDataSource)
            const deletedSalle = await salleUseCase.deleteSalle(getSalleRequest.id)
            if (deletedSalle === null) {
                res.status(404).send({"error": `Salle ${getSalleRequest.id} not found`})
                return
            }
            res.status(200).send(`Salle deleted : ${deletedSalle.name}`)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    //#endregion

    //#region Routes Seance/salle

    /**
 * @swagger
 * /seance/salle/{id}:
 *   get:
 *     summary: Obtenir la liste des séances pour une salle donnée.
 *     description: Récupère la liste des séances programmées pour une salle spécifique en fonction des filtres fournis.
 *     tags:
 *       - Séance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la salle pour laquelle obtenir les séances.
 *         required: true
 *         schema:
 *           type: string
 *         example: 123
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de résultats retournés.
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: page
 *         description: Numéro de la page pour la pagination.
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: dateDebutInterval
 *         description: Permet d'afficher les séances qui ont lieu après cette date
 *         schema:
 *           type: date-time
 *         example: 2024-05-11T20:00:00.000
 *       - in: query
 *         name: dateFinInterval
 *         description: Permet d'afficher les séances qui ont lieu avant cette date
 *         schema:
 *           type: date-time
 *         example: 2024-05-08T20:00:00.000
 *     responses:
 *       '200':
 *         description: Succès de la requête. Retourne la liste des séances pour la salle spécifiée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/seance/salle/:id", authMiddleware,async (req: Request, res: Response) => {
        const validation = getSeancesSalleValidation.validate({...req.params,...req.query})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listSeancesSalleRequest = validation.value
        let limit = 20
        if (listSeancesSalleRequest.limit) {
            limit = listSeancesSalleRequest.limit
        }
        const page = listSeancesSalleRequest.page ?? 1

        try {
            const seanceUseCase = new SeanceUseCase(AppDataSource)
            const selectedSeance = await seanceUseCase.getListSeanceSalle(listSeancesSalleRequest.id,{ ...listSeancesSalleRequest, page, limit })
            res.status(200).send(selectedSeance)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })
    //#endregion

    //#region Routes Seance
    /**
 * @swagger
 * /seance:
 *   post:
 *     summary: Créer une nouvelle séance.
 *     description: Crée une nouvelle séance avec les informations fournies.
 *     tags:
 *       - Séance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données de la nouvelle séance à créer.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateSeanceRequest'
 *     responses:
 *       '201':
 *         description: Séance créée avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '404':
 *         description: Ressource introuvable avec l'ID fourni (film ou salle).
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.post("/seance", authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = createSeanceValidation.validate(req.body)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const createSeanceRequestJSON = validation.value

        const filmUseCase = new FilmUseCase(AppDataSource)
        const filmFound = await filmUseCase.getFilm(createSeanceRequestJSON.filmId)

        if(!filmFound) {
            res.status(400).send("Film introuvable avec cet ID")
            return
        }
        const dureeSeanceVerification = verifDureeSeanceValide(filmFound,createSeanceRequestJSON.dateDebut,createSeanceRequestJSON.dateFin)
        const dateSeanceVerification = verifDateSeanceValide(createSeanceRequestJSON.dateDebut,createSeanceRequestJSON.dateFin) 

        if (!dateSeanceVerification.resultat) {
            res.status(400).send(dateSeanceVerification.errorMessage)
            return
        }
        
        if (!dureeSeanceVerification.resultat ) {
            res.status(400).send(dureeSeanceVerification.errorMessage)
            return
        }
        
        const salleUseCase = new SalleUseCase(AppDataSource)
        const salleFound = await salleUseCase.getSalle(createSeanceRequestJSON.salleId)

        if(!salleFound) {
            res.status(400).send("Salle introuvable avec cet ID")
            return
        }

        if(salleFound.isMaintenance === true) {
            res.status(400).send("La salle est en maintenance")
            return
        }

        const seanceUseCase = new SeanceUseCase(AppDataSource)
        const seancesByFilmFound = await seanceUseCase.getSeanceByFilm(filmFound.id)

        if (seancesByFilmFound.seances) {
            const chevauchementFilmVerification = verifChevauchement(seancesByFilmFound.seances, createSeanceRequestJSON.dateDebut, createSeanceRequestJSON.dateFin,"Film")

            if(!chevauchementFilmVerification.resultat) {
                res.status(400).send(chevauchementFilmVerification.errorMessage)
                return
            }
        }

        const seancesBySalleFound = await seanceUseCase.getSeanceBySalle(salleFound.id)

        if (seancesBySalleFound.seances) {
            const chevauchementSalleVerification = verifChevauchement(seancesBySalleFound.seances, createSeanceRequestJSON.dateDebut, createSeanceRequestJSON.dateFin,"Salle")

            if(!chevauchementSalleVerification.resultat) {
                res.status(400).send(chevauchementSalleVerification.errorMessage)
                return
            }
        }

        filmUseCase.updateFilm(createSeanceRequestJSON.filmId,{isDisponible: true})

        const createSeanceRequest: createSeanceRequest = {
            capacite: salleFound.capacite,
            type: createSeanceRequestJSON.type,
            dateDebut: createSeanceRequestJSON.dateDebut,
            dateFin: createSeanceRequestJSON.dateFin,
            film: filmFound,
            salle: salleFound
        }

        const seanceRepo = AppDataSource.getRepository(Seance)

        try {

            const seanceCreated = await seanceRepo.save(
                createSeanceRequest,
            )

            res.status(201).send(seanceCreated)
        } catch (error) {
            res.status(500).send({ error: "Internal error" })
        }
    }) 
    
    /**
 * @swagger
 * /seance:
 *   get:
 *     summary: Obtenir la liste des séances.
 *     description: Récupère la liste des séances en fonction des filtres fournis.
 *     tags:
 *       - Séance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de résultats retournés.
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: page
 *         description: Numéro de la page pour la pagination.
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: dateDebutInterval
 *         description: Permet d'afficher les séances qui ont lieu après cette date
 *         schema:
 *           type: date-time
 *         example: 2024-05-11T20:00:00.000
 *       - in: query
 *         name: dateFinInterval
 *         description: Permet d'afficher les séances qui ont lieu avant cette date
 *         schema:
 *           type: date-time
 *         example: 2024-05-08T20:00:00.000
 *     responses:
 *       '200':
 *         description: Succès de la requête. Retourne la liste des séances selon les filtres fournis.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.get("/seance", authMiddleware,async (req: Request, res: Response) => {
        const validation = getSeancesValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listSeancesRequest = validation.value
        let limit = 20
        if (listSeancesRequest.limit) {
            limit = listSeancesRequest.limit
        }
        const page = listSeancesRequest.page ?? 1

        try {
            const seanceUseCase = new SeanceUseCase(AppDataSource)
            const selectedSeance = await seanceUseCase.getListSeance({ ...listSeancesRequest, page, limit })
            res.status(200).send(selectedSeance)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /seance/{id}:
 *   patch:
 *     summary: Mettre à jour une séance existante.
 *     description: Met à jour une séance existante avec les informations fournies.
 *     tags:
 *       - Séance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID de la séance à mettre à jour.
 *         required: true
 *         schema:
 *           type: string
 *         example: 123
 *     requestBody:
 *       description: Données à mettre à jour pour la séance spécifiée.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateSeanceRequest'
 *     responses:
 *       '200':
 *         description: Séance mise à jour avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '404':
 *         description: La séance spécifiée n'a pas été trouvée.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.patch("/seance/:id", authMiddlewareAdmin,async (req: Request, res: Response) => {
        const validation = updateSeanceValidation.validate({...req.params,...req.body})

        const updateSeanceRequestJSON = validation.value

        const filmUseCase = new FilmUseCase(AppDataSource)
        const salleUseCase = new SalleUseCase(AppDataSource)
        const seanceUseCase = new SeanceUseCase(AppDataSource)
        const selectedSeance = await seanceUseCase.getSeanceById(updateSeanceRequestJSON.id)

        if(!selectedSeance) {
            res.status(404).send({"error": `Seance ${updateSeanceRequestJSON.id} not found`})
            return
        }

        let updateSeanceRequest: UpdateSeanceRequest = {
            id: updateSeanceRequestJSON.id,
            nbPlacesPrises: updateSeanceRequestJSON.nbPlacesPrises,
            type: updateSeanceRequestJSON.type,
            dateDebut: selectedSeance.dateDebut,
            dateFin: selectedSeance.dateFin,
            salle: selectedSeance.salle,
            film: selectedSeance.film
        }

        if(updateSeanceRequestJSON.filmId) {
            const newFilmFound = await filmUseCase.getFilm(updateSeanceRequestJSON.filmId)
    
            if (!newFilmFound) {
                res.status(404).send({"error": `Film ${updateSeanceRequestJSON.filmId} not found`})
                return
            }

            updateSeanceRequest = {...updateSeanceRequest,film:newFilmFound}
        }

        if(updateSeanceRequestJSON.salleId) {
            const newSalleFound = await salleUseCase.getSalle(updateSeanceRequestJSON.salleId) 

            if (!newSalleFound) {
                res.status(404).send({"error": `Salle ${updateSeanceRequestJSON.salleId} not found`})
                return
            }
            
            updateSeanceRequest = {...updateSeanceRequest,salle: newSalleFound}
        }

        if(updateSeanceRequestJSON.dateDebut) {
            updateSeanceRequest = {...updateSeanceRequest,dateDebut: updateSeanceRequestJSON.dateDebut}
        }

        if(updateSeanceRequestJSON.dateFin) {
            updateSeanceRequest = {...updateSeanceRequest,dateFin: updateSeanceRequestJSON.dateFin}
        }

        const dureeSeanceVerification = verifDureeSeanceValide(updateSeanceRequest.film,updateSeanceRequest.dateDebut,updateSeanceRequest.dateFin)
        const dateSeanceVerification = verifDateSeanceValide(updateSeanceRequest.dateDebut,updateSeanceRequest.dateFin) 
    
        if (!dateSeanceVerification.resultat) {
            res.status(400).send(dateSeanceVerification.errorMessage)
            return
        }
        
        if (!dureeSeanceVerification.resultat ) {
            res.status(400).send(dureeSeanceVerification.errorMessage)
            return
        }

        const seancesByFilmFound = await seanceUseCase.getSeanceByFilm(updateSeanceRequest.film.id, selectedSeance.id)

        if (seancesByFilmFound.seances) {
            const chevauchementFilmVerification = verifChevauchement(seancesByFilmFound.seances, updateSeanceRequest.dateDebut, updateSeanceRequest.dateFin,"Film")

            if(!chevauchementFilmVerification.resultat) {
                res.status(400).send(chevauchementFilmVerification.errorMessage)
                return
            }
        }

        const seancesBySalleFound = await seanceUseCase.getSeanceBySalle(updateSeanceRequest.salle.id, selectedSeance.id)

        if (seancesBySalleFound.seances) {
            const chevauchementSalleVerification = verifChevauchement(seancesBySalleFound.seances, updateSeanceRequest.dateDebut, updateSeanceRequest.dateFin,"Salle")

            if(!chevauchementSalleVerification.resultat) {
                res.status(400).send(chevauchementSalleVerification.errorMessage)
                return
            }
        }

        if (updateSeanceRequestJSON.filmId) {
            filmUseCase.updateFilm(updateSeanceRequestJSON.filmId,{isDisponible: true})
        }

        try {
            const seanceUsecase = new SeanceUseCase(AppDataSource);
            const updatedSeance = await seanceUsecase.updateSeance(updateSeanceRequest.id, { ...updateSeanceRequest })
            if (updatedSeance === null) {
                res.status(404).send({"error": `Seance ${updateSeanceRequest.id} not found`})
                return
            }
            res.status(200).send(updatedSeance)
        } catch (error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /seance/{id}:
 *   delete:
 *     summary: Supprimer une séance existante.
 *     description: Supprime une séance existante en fonction de l'ID spécifié.
 *     tags:
 *       - Séance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID de la séance à supprimer.
 *         required: true
 *         schema:
 *           type: string
 *         example: 123
 *     responses:
 *       '200':
 *         description: Séance supprimée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Seance deleted : 123"
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '404':
 *         description: La séance spécifiée n'a pas été trouvée.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.delete("/seance/:id", authMiddlewareAdmin,async (req: Request, res: Response) => {
        const validation = getSeanceByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getSeanceRequest = validation.value

        try {
            const seanceUseCase = new SeanceUseCase(AppDataSource)
            const seanceFound = await seanceUseCase.getSeanceById(getSeanceRequest.id)

            if (seanceFound === null) {
                res.status(404).send({"error": `Seance ${getSeanceRequest.id} not found`})
                return
            }
            const seanceFilmFound = await seanceUseCase.getSeanceByFilm(seanceFound.film.id, getSeanceRequest.id)
            if (seanceFilmFound.seances.length === 0) {
                const filmUseCase = new FilmUseCase(AppDataSource)
                filmUseCase.updateFilm(seanceFound.film.id,{isDisponible: false})
            }
            const deletedSeance = await seanceUseCase.deleteSeance(seanceFound.id)
            if (deletedSeance === null) {
                res.status(404).send({"error": `Seance ${getSeanceRequest.id} not found`})
                return
            }
            res.status(200).send(`Seance deleted : ${deletedSeance.id}`)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })
    //#endregion

    //#region Routes Film
    /**
 * @swagger
 * /film:
 *   post:
 *     summary: Créer un nouveau film.
 *     description: Crée un nouveau film en utilisant les données fournies dans le corps de la requête.
 *     tags:
 *       - Film
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateFilmRequest'
 *     responses:
 *       '201':
 *         description: Film créé avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.post("/film",authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = createFilmValidation.validate(req.body)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const createFilmRequest = validation.value
        const filmRepo = AppDataSource.getRepository(Film)
        try {

            const filmCreated = await filmRepo.save(
                createFilmRequest
            )
            res.status(201).send(filmCreated)
        } catch (error) {
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /film/{id}:
 *   get:
 *     summary: Obtenir les détails d'un film.
 *     description: Récupère les détails d'un film en fonction de l'ID spécifié.
 *     tags:
 *       - Film
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du film à récupérer.
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     responses:
 *       '200':
 *         description: Succès - Retourne les détails du film demandé.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Le film spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/film/:id",authMiddleware ,async (req: Request, res: Response) => {
        const validation = getFilmByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getFilmRequest = validation.value

        try {
            const filmUseCase = new FilmUseCase(AppDataSource)
            const selectedFilm = await filmUseCase.getFilm(getFilmRequest.id)
            if (selectedFilm === null) {
                res.status(404).send({"error": `film ${getFilmRequest.id} not found`})
                return
            }
            res.status(200).send(selectedFilm)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    /**
 * @swagger
 * /film:
 *   get:
 *     summary: Récupérer la liste des films.
 *     description: Récupère une liste de films en fonction des paramètres fournis.
 *     tags:
 *       - Film
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de films retournés par page.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: page
 *         description: Indique la page de résultats à récupérer.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: isDisponible
 *         description: Filtre sur les films disponible dans le cinéma ou non
 *         required: false
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       '200':
 *         description: Succès - Retourne la liste des films demandée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/film", authMiddleware ,async (req: Request, res: Response) => {
        const validation = getFilmsValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listFilmsRequest = validation.value
        let limit = 20
        if (listFilmsRequest.limit) {
            limit = listFilmsRequest.limit
        }
        const page = listFilmsRequest.page ?? 1

        try {
            const filmUseCase = new FilmUseCase(AppDataSource)
            const selectedFilm = await filmUseCase.getListFilms({ ...listFilmsRequest, page, limit })
            res.status(200).send(selectedFilm)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })
/**
 * @swagger
 * /film/{id}:
 *   patch:
 *     summary: Mettre à jour les détails d'un film.
 *     description: Met à jour les détails d'un film en fonction de l'ID spécifié.
 *     tags:
 *       - Film
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du film à mettre à jour.
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateFilmRequest'
 *     responses:
 *       '200':
 *         description: Succès - Retourne les détails du film mis à jour.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '404':
 *         description: Le film spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.patch("/film/:id",authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = updateFilmValidation.validate({...req.params,...req.body})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const updateFilmRequest = validation.value

        try {
            const filmUseCase = new FilmUseCase(AppDataSource)
            const updatedFilm = await filmUseCase.updateFilm(updateFilmRequest.id, {...updateFilmRequest})
            if (updatedFilm === null) {
                res.status(404).send({"error": `Film ${updateFilmRequest.id} not found`})
                return
            }
            res.status(200).send(updatedFilm)
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    /**
 * @swagger
 * /film/{id}:
 *   delete:
 *     summary: Supprimer un film existant.
 *     description: Supprime un film existant en fonction de l'ID spécifié.
 *     tags:
 *       - Film
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du film à supprimer.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       '200':
 *         description: Film supprimé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Film supprimé : Nom du film"
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '404':
 *         description: Le film spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.delete("/film/:id",authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = getFilmByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const deleteFilmRequest = validation.value

        try {
            const filmUseCase = new FilmUseCase(AppDataSource)
            const deletedFilm = await filmUseCase.deleteFilm(deleteFilmRequest.id)
            if (deletedFilm === null) {
                res.status(404).send({"error": `Salle ${deleteFilmRequest.id} not found`})
                return
            }
            res.status(200).send(`Film deleted : ${deletedFilm.name}`)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })
    //#endregion

    //#region Routes Seance/Film
    /**
 * @swagger
 * /seance/film/{id}:
 *   get:
 *     summary: Récupérer la liste des séances pour un film donné.
 *     description: Récupère une liste de séances pour un film donné en fonction de l'ID spécifié.
 *     tags:
 *       - Séance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du film pour lequel récupérer les séances.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de séances retournées par page.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: page
 *         description: Indique la page de résultats à récupérer.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       '200':
 *         description: Succès - Retourne la liste des séances demandée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '403':
 *         description: Accès interdit, un jeton d'authentification valide est requis.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/seance/film/:id",authMiddleware ,async (req: Request, res: Response) => {
        const validation = getSeancesFilmValidation.validate({...req.params,...req.query})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listSeancesFilmRequest = validation.value
        let limit = 20
        if (listSeancesFilmRequest.limit) {
            limit = listSeancesFilmRequest.limit
        }
        const page = listSeancesFilmRequest.page ?? 1

        try {
            const seanceUseCase = new SeanceUseCase(AppDataSource)
            const selectedSeance = await seanceUseCase.getListSeanceFilm(listSeancesFilmRequest.id,{ ...listSeancesFilmRequest, page, limit })
            res.status(200).send(selectedSeance)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })
    //#endregion

    //#region Routes Roles
    /**
 * @swagger
 * /role:
 *   post:
 *     summary: Créer un nouveau rôle.
 *     description: Crée un nouveau rôle en utilisant les données fournies dans le corps de la requête.
 *     tags:
 *       - Rôle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateRoleRequest'
 *     responses:
 *       '201':
 *         description: Rôle créé avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.post('/role', authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = createRoleValidation.validate(req.body)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const createRoleRequest = validation.value
        const roleRepo = AppDataSource.getRepository(Role)
        try {

            const roleCreated = await roleRepo.save(
                createRoleRequest
            )
            res.status(201).send(roleCreated)
        } catch (error) {
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /role/{id}:
 *   get:
 *     summary: Récupérer un rôle par son ID.
 *     description: Récupère un rôle existant en fonction de l'ID spécifié.
 *     tags:
 *       - Rôle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du rôle à récupérer.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       '200':
 *         description: Succès - Retourne les détails du rôle demandé.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '404':
 *         description: Le rôle spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/role/:id", authMiddlewareAdmin, async (req: Request, res: Response) => {
        const validation = getRoleByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getRoleRequest = validation.value

        try {
            const roleUseCase = new RoleUseCase(AppDataSource)
            const selectedRole = await roleUseCase.getRole(getRoleRequest.id)
            if (selectedRole === null) {
                res.status(404).send({"error": `Role ${getRoleRequest.id} not found`})
                return
            }
            res.status(200).send(selectedRole)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    /**
 * @swagger
 * /role:
 *   get:
 *     summary: Récupérer la liste des rôles.
 *     description: Récupère une liste de rôles en fonction des paramètres de requête fournis.
 *     tags:
 *       - Rôle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de rôles retournés par page.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: page
 *         description: Indique la page de résultats à récupérer.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: isAdmin
 *         description: Filtre sur les rôles admin ou non
 *         required: false
 *         schema:
 *           type: boolean
 *         example: false
 *     responses:
 *       '200':
 *         description: Succès - Retourne la liste des rôles demandée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/role", authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = getRolesValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listRolesRequest = validation.value
        let limit = 20
        if (listRolesRequest.limit) {
            limit = listRolesRequest.limit
        }
        const page = listRolesRequest.page ?? 1

        try {
            const roleUseCase = new RoleUseCase(AppDataSource)
            const selectedRole = await roleUseCase.getListRole({ ...listRolesRequest, page, limit })
            res.status(200).send(selectedRole)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /role/{id}:
 *   patch:
 *     summary: Mettre à jour un rôle existant.
 *     description: Met à jour un rôle existant en fonction de l'ID spécifié et des données fournies dans le corps de la requête.
 *     tags:
 *       - Rôle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du rôle à mettre à jour.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateRoleRequest'
 *     responses:
 *       '200':
 *         description: Rôle mis à jour avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '404':
 *         description: Le rôle spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.patch("/role/:id", authMiddlewareAdmin ,async (req: Request, res: Response) => {

        const validation = updateRoleValidation.validate({...req.params, ...req.body})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const updateRoleRequest = validation.value

        try {
            const roleUsecase = new RoleUseCase(AppDataSource);
            const updatedRole = await roleUsecase.updateRole(updateRoleRequest.id, { ...updateRoleRequest })
            if (updatedRole === null) {
                res.status(404).send({"error": `Role ${updateRoleRequest.id} not found`})
                return
            }
            res.status(200).send(updatedRole)
        } catch (error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /role/{id}:
 *   delete:
 *     summary: Supprimer un rôle existant.
 *     description: Supprime un rôle existant en fonction de l'ID spécifié.
 *     tags:
 *       - Rôle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du rôle à supprimer.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       '200':
 *         description: Rôle supprimé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Rôle supprimé : Nom du rôle"
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '404':
 *         description: Le rôle spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.delete("/role/:id", authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = getRoleByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getRoleRequest = validation.value

        try {
            const roleUseCase = new RoleUseCase(AppDataSource)
            const deletedRole = await roleUseCase.deleteRole(getRoleRequest.id)
            if (deletedRole === null) {
                res.status(404).send({"error": `Role ${getRoleRequest.id} not found`})
                return
            }
            res.status(200).send(`Role deleted : ${deletedRole.name}`)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })
    //#endregion

    //#region Routes User
/**
 * @swagger
 * /user:
 *   get:
 *     summary: Récupérer la liste des utilisateurs.
 *     description: Récupère une liste d'utilisateurs en fonction des paramètres de requête fournis.
 *     tags:
 *       - Utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Limite le nombre d'utilisateurs retournés par page.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: page
 *         description: Indique la page de résultats à récupérer.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: isAdmin
 *         description: Indique si l'utilisateur est un administrateur.
 *         required: false
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       '200':
 *         description: Succès - Retourne la liste des utilisateurs demandée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/user",authMiddlewareAdmin, async (req: Request, res: Response) => {
        const validation = getUsersValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listUsersRequest = validation.value
        let limit = 20
        if (listUsersRequest.limit) {
            limit = listUsersRequest.limit
        }
        const page = listUsersRequest.page ?? 1

        try {
            const userUseCase = new UserUseCase(AppDataSource)
            const selectedUser = await userUseCase.getListUser({ ...listUsersRequest, page, limit })
            res.status(200).send(selectedUser)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

    /**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID.
 *     description: Récupère un utilisateur existant en fonction de l'ID spécifié.
 *     tags:
 *       - Utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID de l'utilisateur à récupérer.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       '200':
 *         description: Succès - Retourne les détails de l'utilisateur demandé.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être un administrateur.
 *       '404':
 *         description: L'utilisateur spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/user/:id",authMiddlewareAdmin ,async (req: Request, res: Response) => {
        const validation = getUserByIdValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const getUserRequest = validation.value

        try {
            const userUseCase = new UserUseCase(AppDataSource)
            const selectedUser = await userUseCase.getUser(getUserRequest.id)
            if (selectedUser === null) {
                res.status(404).send({"error": `User ${getUserRequest.id} not found`})
                return
            }
            res.status(200).send(selectedUser)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })
    //#endregion

    //#region Routes Achat
    /**
 * @swagger
 * /achat/billet:
 *   get:
 *     summary: Acheter un billet.
 *     description: Permet à un utilisateur d'acheter un billet en utilisant son compte. Le type de billet peut être spécifié dans le corps de la requête.
 *     tags:
 *       - Achat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateBilletRequest'
 *     responses:
 *       '200':
 *         description: Billet acheté avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Utilisateur ou compte non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/achat/billet", authMiddleware, async (req: Request, res: Response) => {
        const validation = createBilletValidation.validate(req.body)
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const createBilletRequest = validation.value

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        let nbUtilisation = 1
        
        if(createBilletRequest.type === 2) {
            nbUtilisation = 10
        }

        const compteUseCase = new CompteUseCase(AppDataSource)
        const compteFound = await compteUseCase.getCompte(userFound.compte.id,userFound.id)

        if(!compteFound) {
            res.status(404).send({"error": `Compte not found`})
            return
        }

        if(createBilletRequest.type === 1) {
            if(!process.env.PRIX_BILLET_SIMPLE) {
                res.status(500).send({"error": "Internal error "})
                return
            }

            const prixBilletSimple = parseFloat(process.env.PRIX_BILLET_SIMPLE)
            if(compteFound.solde < prixBilletSimple) {
                res.status(400).send({"error": "Votre solde est insuffisant "})
                return
            }

            compteFound.solde = compteFound.solde - prixBilletSimple
            await AppDataSource.getRepository(Compte).save(compteFound)

            await AppDataSource.getRepository(CompteTransaction).save({
                montant: prixBilletSimple,
                type: "achat_billet",
                compte: compteFound
            })

        } else if (createBilletRequest.type === 2) {
            
            if(!process.env.PRIX_BILLET_OR) {
                res.status(500).send({"error": "Internal error "})
                return
            }

            const prixBilletOr = parseFloat(process.env.PRIX_BILLET_OR)
            if(compteFound.solde < prixBilletOr) {
                res.status(400).send({"error": "Votre solde est insuffisant "})
                return
            }

            compteFound.solde = compteFound.solde - prixBilletOr
            await AppDataSource.getRepository(Compte).save(compteFound)

            await AppDataSource.getRepository(CompteTransaction).save({
                montant: prixBilletOr,
                type: "achat_billet",
                compte: compteFound
            })
        }

        try {
            const billetRepo = AppDataSource.getRepository(Billet)
            const billetCreated = await billetRepo.save({
                name: createBilletRequest.name,
                type: createBilletRequest.type,
                nbUtilisation: nbUtilisation,
                user: userFound
            })
            res.status(200).send({"id":billetCreated.id,"name":billetCreated.name,"type":billetCreated.type,"nbUtilisation":billetCreated.nbUtilisation})
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })
    //#endregion

    //#region Routes Reservation
/**
 * @swagger
 * /reservation/seance/{id}:
 *   post:
 *     summary: Réserver une place pour une séance.
 *     description: Réserve une place pour une séance spécifique en utilisant un billet valide.
 *     tags:
 *       - Réservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID de la séance à réserver.
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/ReservationSeanceRequest'
 *     responses:
 *       '200':
 *         description: Succès - La réservation a été effectuée avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '403':
 *         description: La séance n'a plus de places disponibles ou le billet n'est plus valable.
 *       '404':
 *         description: La séance ou le billet spécifié n'a pas été trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.post("/reservation/seance/:id", authMiddleware, async (req: Request, res: Response) => {
        const validation = reservationSeanceValidation.validate({...req.params,...req.body})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        const reservationSeanceRequest = validation.value

        const seanceUseCase = new SeanceUseCase(AppDataSource)
        const seanceFound = await seanceUseCase.getSeanceById(reservationSeanceRequest.id)

        if(!seanceFound) {
            res.status(404).send({"error": `Seance ${reservationSeanceRequest.id} not found`})
            return
        }

        if(seanceFound.nbPlacesPrises >= seanceFound.capacite) {
            res.status(403).send({"error": "La séance n'a plus de places disponible"})
            return
        }

        const billetUseCase = new BilletUseCase(AppDataSource)
        const billetFound = await billetUseCase.getBilletUser(reservationSeanceRequest.billetId, userFound.id)

        if(!billetFound) {
            res.status(404).send({"error": `Billet ${reservationSeanceRequest.billetId} not found`})
            return
        }

        if(billetFound.nbUtilisation < 1) {
            res.status(403).send({"error": "Le billet n'est plus valable"})
            return
        }

        try {
            billetFound.seances.push(seanceFound)
            billetFound.nbUtilisation -= 1
            await AppDataSource.getRepository(Billet).save(billetFound)

            seanceFound.nbPlacesPrises += 1
            await AppDataSource.getRepository(Seance).save(seanceFound)

            res.status(200).send("La reservation a bien été prise en compte")
        } catch (error) {
            res.status(500).send({ error: "Internal error" })
        }

    })
    //#endregion

    //#region Routes Billets
/**
 * @swagger
 * /billets:
 *   get:
 *     summary: Récupérer la liste des billets de l'utilisateur.
 *     description: Récupère une liste des billets de l'utilisateur authentifié en fonction des paramètres de requête fournis.
 *     tags:
 *       - Billets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Limite le nombre de billets retournés par page.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: page
 *         description: Indique la page de résultats à récupérer.
 *         required: false
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: type
 *         description: Filtre les billets par type (1 pour un billet simple, 2 pour un billet VIP).
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2
 *         example: 1
 *     responses:
 *       '200':
 *         description: Succès - Retourne la liste des billets de l'utilisateur demandée.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Utilisateur non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/billets", authMiddleware, async (req: Request, res: Response) => {
        const validation = getBilletsValidation.validate(req.query)

        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        const listBilletsRequest = validation.value
        let limit = 20
        if (listBilletsRequest.limit) {
            limit = listBilletsRequest.limit
        }
        const page = listBilletsRequest.page ?? 1

        try {
            const billetUseCase = new BilletUseCase(AppDataSource)
            const billetSelected = await billetUseCase.getListBillet(userFound.id,{ ...listBilletsRequest, page, limit })
            res.status(200).send(billetSelected)
        }catch(error) {
            res.status(500).send({ error: "Internal error" })
        }
    })
    //#endregion

    //#region Routes Compte
    /**
 * @swagger
 * /compte/{id}:
 *   get:
 *     summary: Récupérer un compte utilisateur.
 *     description: Récupère un compte utilisateur en fonction de l'ID spécifié.
 *     tags:
 *       - Compte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du compte à récupérer.
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     responses:
 *       '200':
 *         description: Succès - Retourne le compte utilisateur demandé.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Compte non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/compte/:id",authMiddleware ,async (req: Request, res: Response) => {
        const validation = getCompteValidation.validate({...req.params})

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        const getCompteRequest = validation.value

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        try {
            const compteUseCase = new CompteUseCase(AppDataSource)
            const selectedCompte = await compteUseCase.getCompte(getCompteRequest.id,userFound.id)
            if (selectedCompte === null) {
                res.status(404).send({"error": `Compte ${getCompteRequest.id} not found`})
                return
            }
            res.status(200).send(selectedCompte)
        }catch(error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    /**
 * @swagger
 * /compte/{id}/depot:
 *   patch:
 *     summary: Effectuer un dépôt sur un compte utilisateur.
 *     description: Effectue un dépôt sur un compte utilisateur en fonction de l'ID spécifié.
 *     tags:
 *       - Compte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du compte sur lequel effectuer le dépôt.
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     requestBody:
 *       description: Données sur le montant.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateCompteRequest'
 *     responses:
 *       '200':
 *         description: Succès - Retourne le compte utilisateur mis à jour après le dépôt.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Compte non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.patch("/compte/:id/depot", authMiddleware ,async (req: Request, res: Response) => {
        const validation = updateCompteValidation.validate({...req.params, ...req.body})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        const updateCompteRequest = validation.value

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        try {
            const compteUseCase = new CompteUseCase(AppDataSource);
            const updatedCompte = await compteUseCase.updateCompte(updateCompteRequest.id, { ...updateCompteRequest,type:"depot" },userFound.id)
            if (updatedCompte === null) {
                res.status(404).send({"error": `Compte ${updateCompteRequest.id} not found`})
                return
            }

            await AppDataSource.getRepository(CompteTransaction).save({
                montant: updateCompteRequest.montant,
                type: "depot",
                compte: updatedCompte
            })

            res.status(200).send(updatedCompte)
        } catch (error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })

        /**
 * @swagger
 * /compte/{id}/retrait:
 *   patch:
 *     summary: Effectuer un retrait sur un compte utilisateur.
 *     description: Effectue un retrait sur un compte utilisateur en fonction de l'ID spécifié.
 *     tags:
 *       - Compte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: L'ID du compte sur lequel effectuer le retrait.
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     requestBody:
 *       description: Données sur le montant.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateCompteRequest'
 *     responses:
 *       '200':
 *         description: Succès - Retourne le compte utilisateur mis à jour après le retrait.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Compte non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.patch("/compte/:id/retrait",authMiddleware ,async (req: Request, res: Response) => {
        const validation = updateCompteValidation.validate({...req.params, ...req.body})

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        const updateCompteRequest = validation.value

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        try {
            const compteUseCase = new CompteUseCase(AppDataSource);
            const updatedCompte = await compteUseCase.updateCompte(updateCompteRequest.id, { ...updateCompteRequest,type:"retrait" },userFound.id)
            if (updatedCompte === null) {
                res.status(404).send({"error": `Compte ${updateCompteRequest.id} not found`})
                return
            }

            await AppDataSource.getRepository(CompteTransaction).save({
                montant: updateCompteRequest.montant,
                type: "retrait",
                compte: updatedCompte
            })

            res.status(200).send(updatedCompte)
        } catch (error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })
    //#endregion

    //#region Routes Transactions
/**
 * @swagger
 * /transaction:
 *   get:
 *     summary: Récupérer la liste des transactions de l'utilisateur.
 *     description: Renvoie la liste des transactions de l'utilisateur authentifié, filtrée par type si spécifié.
 *     tags:
 *       - Transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Numéro de page pour la pagination (optionnel).
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         description: Nombre maximum d'éléments par page (optionnel).
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: type
 *         description: Type de transaction (optionnel).
 *         schema:
 *           type: string
 *           enum: [depot, retrait, achat_billet]
 *         example: depot
 *     responses:
 *       '200':
 *         description: Liste des transactions récupérée avec succès.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Non autorisé. L'utilisateur doit être authentifié.
 *       '404':
 *         description: Utilisateur non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.get("/transaction", authMiddleware, async (req: Request, res: Response) => {
        const validation = getTransactionsValidation.validate(req.query)

        if(validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

        const token = authHeader.split(' ')[1];
        if (token === null) return res.status(401).json({"error": "Unauthorized"});

        const getTransactionRequest = validation.value

        const userUseCase = new UserUseCase(AppDataSource)
        const userFound = await userUseCase.getUserByToken(token)

        if(!userFound) {
            res.status(404).send({"error": `User not found`})
            return
        }

        let limit = 20
        if (getTransactionRequest.limit) {
            limit = getTransactionRequest.limit
        }
        const page = getTransactionRequest.page ?? 1

        try {
            const transactionUseCase = new TransactionUseCase(AppDataSource)
            const transactions = await transactionUseCase.getListTransactions({ ...getTransactionRequest, page, limit }, userFound.compte.id)
            res.status(200).send(transactions)
        }catch(error) {
            console.log(error)
            res.status(500).send({ error: "Internal error" })
        }
    })
    //#endregion

    UserHandler(app)
}