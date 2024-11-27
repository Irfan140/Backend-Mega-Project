// require('dotenv').config({path: './env'}) 
import dotenv from "dotenv" // improve varient

import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})



connectDB()
.then(() => {
    app.on("error", (error)=> {
        console.log("ERRR: ",error)
        throw error
       })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})



//? Different Approach

/* 

import express from "express"
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

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
3. must do  when we use import statement for dotenv
4. when we make changes in .env file we have to manually restart the server 
5. use npm run dev command to run the file
*/