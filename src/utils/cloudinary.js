import {v2 as cloudinary} from "cloudinary" // changed the name of v2 as cloudinary
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// uploading takes some time and also error prone
const uploadOnCloudinary = async (localFilePath) => {
    // localFilePath -> it is the file that is uploaded
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" //  It will automatically figureout the type of data
        })
        // file has been uploaded successfull to check use log it ->
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        // remove the locally saved temporary file because the upload operation got failed
        fs.unlinkSync(localFilePath) 
        return null;
    }
}



export {uploadOnCloudinary}

/*

1. we will first upload the file in our local server  and then we will use cloudinary and upload it to their server. (industry practice -> sometimes we need to do something on it before sending to the server)
2. This code is reusable and can be used in any other project where we use cloudinary
3. we made it a utils so that we can use it repeatatively...(ssometimes we may make it as amiddleware depending upon the usecase)
4. 

 */