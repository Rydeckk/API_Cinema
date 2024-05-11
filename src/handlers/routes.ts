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

export const initRoutes = (app: express.Express) => {

    //#region Routes salle
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
}