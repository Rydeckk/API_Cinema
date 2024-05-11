import express from "express";
import { initRoutes } from "./handlers/routes";
import { AppDataSource } from "./database/database";
import { UserHandler } from "./handlers/user";


const main = async () => {
    const app = express()
    const port = 3000

    try {

        await AppDataSource.initialize()
        console.error("well connected to database")
    } catch (error) {
        console.log(error)
        console.error("Cannot contact database")
        process.exit(1)
    }

    app.use(express.json())
    initRoutes(app)
    UserHandler(app)
    app.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}

main()