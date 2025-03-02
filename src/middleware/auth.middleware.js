
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next)=>{
    
   try {
     // Accesing Token From Cookies
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
     if (!token) {
         throw new ApiError(401, "UnAuthorised request")
     }
 
     // Verifying Token using JWT
     const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     // Finding user 
     const user = await User.findById(decodedToken?._id).select(" -password  -refreshToken")
 
     if (!user) {
         throw new ApiError(401, "Invalid access token")
     }
 
     // Adding user to req object
     req.user= user
     next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
   }
    
})