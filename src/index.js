import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"
import connectDB from "./db/db.js";
import express from 'express'
import { app } from "./app.js";

import dotenv from "dotenv"

// const app = express()

dotenv.config({
    path : './.env'
}
)



connectDB()

.then( () => {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.error("mongodb error", error);

    
})



/*
import express from "express"

const app = express()


// Connect to MongoDB 

( async () => {
    try {

       await mongoose.connect(`${process.env.MONGODB_URL}
            /${DB_NAME}`)
            app.on("error" , () => {
                console.log("Error connecting to MongoDB");
                
            })


            app.listen(process.env.PORT, () => {
                console.log(`Server is running on port ${process.env.PORT}`);
                
            })
        
    } catch (error) {
        console.error("Error" , error)
        
    }
})()

*/