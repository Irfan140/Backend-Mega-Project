import express from "express"
import cors from "cookie-parser"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// we limit the amount of jason data that comes to our server
app.use(express.json({limit: "16kb"}))
// also able to read special character url
app.use(express.urlencoded({extended: true, limit: "16kb"})) 
// for static files lime images, videos etc
app.use(express.static("public"))
// to implement CRUD operations on cookies
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'



// routes declaration
app.use("/api/v1/users", userRouter) // whenever we go to /api/v1/users (industry practice -> v1 is vrsion number) -> control will be be moved to userRouter middleware


export  { app }


/*

1. we do app.use() in case of a middleware
2. 

*/