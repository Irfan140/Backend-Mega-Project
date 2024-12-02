import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// verifying the token so that we can logout the user on the basis of token
export const verifyJWT = asyncHandler( async (req, res, next) => {
    try {
        // Both req and res has the access of cookies
        // Taking accessToken 
        // Incase we donot get the accessToken (in case of mobile appication) we will also check the  custom header that the user sended to us
        // In custom header  We get -> Bearer <token>
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") // we only need token
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        // Verifying the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // Removing the unwanted fields from decodedToken
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }

        // Adding new object i.e user to our the request
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})