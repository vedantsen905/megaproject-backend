import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"
import connectDB from "./db/db.js";

import dotenv from "dotenv"

dotenv.config({
    path : './env'
}
)



connectDB()



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