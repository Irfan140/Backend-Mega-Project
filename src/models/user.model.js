import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, // ensures no extra spaces around the value.
            index: true // makes searches faster for this field.
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId, // An array of video IDs (ObjectId) the user has watched.
                ref: "Video" // References the Video collection.
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String // A token for refreshing access tokens when they expire.
        }

    },
    {
        timestamps: true
    }
)

// arrow function doesnot have the context (this) when use in callback nut normal function has 
userSchema.pre("save", async function (next) {
    // donot do anything only pass to the net middleware if password is not modified
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    /* Compares a plain-text password with the hashed password stored in the database.
        Returns true if the password matches, otherwise false.
    */
    return await bcrypt.compare(password, this.password)
}

/*  Generate Access Token 

Creates a short-lived token containing user details (_id, email, username, etc.).
Uses a secret key (ACCESS_TOKEN_SECRET) to sign the token.
expiresIn sets the token's expiration time (e.g., 1 hour).

*/
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

/*
Generate Refresh Token

Creates a longer-lived token for refreshing the access token when it expires.
Includes only the user's _id to keep it lightweight.

*/
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
/*
Model creation

Creates a User model linked to the userSchema.
Represents the User collection in the database.

*/
export const User = mongoose.model("User", userSchema)


/*

1. mongoose: A library to interact with MongoDB, allowing you to define schemas and models.
2. { Schema }: Used to define the structure of the data in a MongoDB collection.
3. jwt: Library for creating JSON Web Tokens (JWT), used for authentication.
4. bcrypt: Library to securely hash and compare passwords.


--> pre("save") Hook:
Runs before saving a document.
Checks if the password is modified. If not, it skips processing.
If modified, it hashes the password using bcrypt for security.



1. Why user.model.js?

It's a convention in the industry to name files like user.model.js when they define a model. This makes it clear that the file contains the schema and model logic for the User collection.
2. MongoDB and Unique IDs:

MongoDB automatically assigns a unique _id to each document when you save it. So, we don’t need to write extra code for generating IDs.
3. Cloudinary Explained:

Cloudinary is a cloud service (similar to AWS) for storing and managing media files like images and videos. When we upload a file, Cloudinary provides a URL that we can save in our database to access the file.
4. Middleware in MongoDB:

Middleware (also called "hooks") in MongoDB allows us to run custom logic before or after certain actions, like saving or deleting a document. In this case, we use middleware to hash the password before saving it.
5. JWT (JSON Web Token):

JWT is like a "bearer token," meaning if a user presents this token to the server, the server will trust it and provide access to the requested data. The token carries encrypted user information to verify their identity.



Example:
Access token: "Here’s proof I’m allowed to access this resource right now."
Refresh token: "Here’s my permission to get a new access token when this one expires."

 */