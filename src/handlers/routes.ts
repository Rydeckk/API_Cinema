import express, { Request, Response } from "express";
import { createSalleValidation, getSalleByIdValidation, getSallesValidation, updateSalleValidation } from "./validators/salle-validator";
import { generateValidationErrorMessage } from "./validators/generate-validation-messages";
import { AppDataSource } from "../database/database";
import { Salle } from "../database/entities/salle";
import { SalleUseCase } from "../domain/salle-usecase";
import { createSeanceRequest, createSeanceValidation, getSeanceByIdValidation, getSeancesFilmValidation, getSeancesSalleValidation, getSeancesValidation, UpdateSeanceRequest, updateSeanceValidation, verifChevauchement, verifDateSeanceValide, verifDureeSeanceValide, verifErrorRequest } from "./validators/seance-validator";
import { Seance } from "../database/entities/seance";
import { FilmUseCase } from "../domain/film-usecase";
import { Film } from "../database/entities/film";
import { createFilmValidation, getFilmByIdValidation, getFilmsValidation, updateFilmValidation } from "./validators/film-validator";
import { SeanceUseCase } from "../domain/seance-usecase";

export const initRoutes = (app: express.Express) => {

    //#region Routes salle
    app.post("/salle", async (req: Request, res: Response) => {
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

    app.get("/salle/:id", async (req: Request, res: Response) => {
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

    app.get("/salle", async (req: Request, res: Response) => {
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

    app.patch("/salle/:id", async (req: Request, res: Response) => {

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

    app.delete("/salle/:id", async (req: Request, res: Response) => {
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

    app.get("/seance/salle/:id", async (req: Request, res: Response) => {
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
    app.post("/seance", async (req: Request, res: Response) => {
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
    
    app.get("/seance", async (req: Request, res: Response) => {
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

    app.patch("/seance/:id", async (req: Request, res: Response) => {
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

    app.delete("/seance/:id", async (req: Request, res: Response) => {
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
    app.post("/film", async (req: Request, res: Response) => {
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

    app.get("/film/:id", async (req: Request, res: Response) => {
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

    app.get("/film", async (req: Request, res: Response) => {
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

    app.patch("/film/:id", async (req: Request, res: Response) => {
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

    app.delete("/film/:id", async (req: Request, res: Response) => {
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
    app.get("/seance/film/:id", async (req: Request, res: Response) => {
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
}