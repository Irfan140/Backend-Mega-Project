import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

// Since generating access and refresh token is used many times so we made a method for it
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        // finding user by its id (an unique id is automatically generated my mongodb for ecah user)
        const user = await User.findById(userId)
        // generating acces token
        const accessToken = user.generateAccessToken()
        // generating refresh token 
        const refreshToken = user.generateRefreshToken()

        // adding refreshToken to our user object
        user.refreshToken = refreshToken
        // saving the refreshToken in the user
        await user.save({ validateBeforeSave: false }) // validateBeforeSave: false means -> donot do any validation , just store it

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


// User registration
const registerUser = asyncHandler( async (req,res) => {
    /*
    Steps for making registering a user

    -> get user details from frontend
    -> validation - not empty
    -> check if user already exists: username, email
    -> check for images, check for avatar
    -> upload them to cloudinary, avatar
    -> create user object - create entry in db
    -> remove password and refresh token field from response
    -> check for user creation
    -> return res

     */
    
    const {fullName, email, username, password} = req.body // data from form and body can be get from req.body (for data from url something else is used)
    

    // This code snippet is a validation check to ensure that all required fields for a form submission (like fullName, email, username, and password) are filled out. If any of the fields are empty or consist only of whitespace, an error is thrown.

    // With Optional Chaining (?.): Using field?.trim(), the code checks if field is not null or undefined before attempting to call the trim() method
    if( 
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
        /*
        ApiError(400, "All fields are required"):
            Creates an instance of a custom error class (ApiError), indicating a 400 Bad Request error.
            400: HTTP status code for a bad request.
            "All fields are required": The error message describing the problem.
        */
    }

    // The $or operator in MongoDB is used to specify multiple conditions in a query where at least one condition must be true for the document to be considered a match. It’s a logical operator that combines multiple query expressions and performs a logical OR operation.
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    // multer gives req.files
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // This is more error less way as compared to upper code
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    // uploading on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // db entry for user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // if not empty take and if empty then take nothing becaues this field is not required
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        // we write what field we donot want to select
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500), "Something went wrong while registering the user"
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


// User Login
const loginUser = asyncHandler(async (req, res) => {
    /*
    --> from req body take data
    --> validate the user using username or email (We will Make the code such that , we an validate using either email or username)
    --> find the user
    --> password check
    --> generate access and referesh token
    --> send these tokens i  the form of  cookies (secure cookies)
    */

    // Taking data from user
    // It extracts specific properties (email, username, and password) from the object req.body and assigns their values to the corresponding variables.
    const {email, username, password} = req.body

    // We need atleast one -> either email or username for validation
    if(!(username || email)) {
        throw new ApiError(400, "username or password is required")
    }

    // Finding user 
    // here depending upon the type of validation , means validate using either email or fullname -> so we wrote both email and fullname in the array
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // password Checking
    const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }
    
    // Taking the generated accessToken and refreshToken from the user
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    //  Removing the password and refreshToken field before sending the response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // options for the cookines 
    // by default anyone can modify our cookie in the frontend
    // Using httpOnly: true and secure: true -> our cookie can only be modified from the server
    const options = {
        httpOnly: true,
        secure: true
    }

    // sending what we need to send in the form of response
    // It includes setting HTTP status codes, cookies, and sending a JSON response.
    return res
    .status(200)
    //  Setting Cookies
    // Purpose: To send cookies to the client, which can be stored in the browser for maintaining sessions or authentication.
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

// User Logout
const logOutUser = asyncHandler( async (req, res) => {
    // We donot have the access of user , so we canot get its id and details for logging out, so we will make our own middleware for the work (authentication work)

    // After doing the work of middleware we now have the access of user in req

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    // options for cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    // Clearing the cookies
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

}) 


// controller for Refresh access token end point -> method for giving a new access token to our user by verifying the refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Taking refreshToken 
    // req.body.refreshToken for mobile app
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // checking the access token is valid ot not
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    // verifying the Refresh token of the user and the refresh token stored in our db
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        // Finding the user in the db using the decodedToken._id
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        // checking the incomingRefreshToken whether it matches with user.refreshToken (that is stored in our db)
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
        
        // Generating new access token
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
        // options for cookies
        const options = {
            httpOnly: true,
            secure: true
        }

        // Sending response
        return res
        .status(200)
        // setting cookies
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

// updaing password
const changeCurrentPassword = asyncHandler(async(req, res) => {

    // Taking the old password and the new password ( that the user wants to set) from the user
    const {oldPassword, newPassword} = req.body

    // Finding the user
    const user = await User.findById(req.user?._id)

    // Checking the old password  -> ifit is correct or not
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // Setting the old password  with new password
    user.password = newPassword
    
    // Saving the new password
    await user.save({validateBeforeSave: false})

    // Sending the response
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


// Getting current user details
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})


// Updating the account details
const updateAccountDetails = asyncHandler(async(req, res) => {

    // Suppose we want to update the fullName and email
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    // Finding abd updating the user
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true} // returns the information after the update
        
    ).select("-password") // removing the password field

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});


// Updating the avatar
const updateUserAvatar = asyncHandler(async(req, res) => {

    // Taking access of path using req.file from multer
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    // uploading the new avatar on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    // Finding the user and updating the avatar
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url // setting the avatar
            }
        },
        {new: true}
    ).select("-password") // removing the password field

    
    // Sending the response
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})


// Updaing user cover image (same as updating avatar)
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}