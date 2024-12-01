import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


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

export {registerUser}