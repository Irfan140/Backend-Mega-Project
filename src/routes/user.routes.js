import { Router } from "express" // Imports the Router class from the express library
import { registerUser } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"


const router = Router()

// means when we get a request at register route then registerUser get executed
router.route("/register").post(
    // middleware 
    // when we make the frontend then its field name must be same as below mentioned names
    upload.fields([
        {
            name: "avatar", 
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


export default router


/*
-> Purpose of Router 

The Router is used to create a mini, modular instance of a route-handling object.
This helps in organizing your routes instead of defining them directly on the main app object in a large application.

-> Purpose of registerUSer function

The registerUser function is the handler for processing user registration requests.
It contains the business logic for handling the registration process, like validating input, saving the user to a database, and returning a response.


-> router.route("/register"): Specifies the /register endpoint.
.post(registerUser): Attaches a POST method to this route, so it listens only for HTTP POST requests. When a POST request is made to /register, the registerUser function is called.

-> middleware are like jate huwa mujhse milkr jana

*/