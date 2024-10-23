// require('dotenv').config({path: './env'}) 
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})



connectDB()

//? Different Approach

/* 

import express from "express"
const app = express()


;( async () => {
    try{
       await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
       app.on("error", (error)=> {
        console.log("ERRR: ",error)
        throw error
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`)
       })

    } catch(error){
        console.log("ERROR: ",error)
        throw error
    }
})()


*/

/* 
Some important points from Hitesh Sir regarding DB
1. Always use try catch for handleling DB (because of)
2. DB is on another continent (means it takes time so use async await)

Some other points
1. For IIFE always use ; before using
2. As early as possible in our application -> import and configure dotenv
*/