// require('dotenv').config({ path : ".env"})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
    .then(
        () => {
            app.on("error", (err) => {
                console.error("Error in server:", err);
                throw err;
            })
        }
    )
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })

    })
    .catch((err) => {
        console.log("Error in Database connection", err);

    })

dotenv.config({
    path: ".env"
})


/*
import express from "express"
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("Error",error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR", error)
        throw error

    }
})()

*/
