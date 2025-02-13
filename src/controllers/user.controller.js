import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  // Get User Details from frontend
  // Validation Not-empty
  // Check If User Alredy Exist: username , Email
  // Check for image , check for avatar
  // Upload them to cloudinary
  // Create user object , create entry in db
  // Remove password and refresh token from response
  // Check for user creation
  // Return response

  const { fullName, email, userName, password } = res.body


  // validationg non empty
  // if (fullName === "") {
  //   throw new ApiError(400, "Full name is required")
  // }

  if ([fullName, email, userName, password].some((field) => field?.trim() === ""
  )) {
    throw new ApiError(400, "All fields are required")
  }

  // Checking For existed user
  const existedUser = User.findOne({
    $or: [{userName},{email}]
  })

  if(existedUser){
    throw new ApiError(409, "User already exist")
  }

  // Checking For image

  const avatarLoacalPath = res.files?.avatar[0]?.path;
  const coverImagelocalPath = res.files?.coverImage[0]?.path;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "avatar image is required")   
  }

  // Upload to cloudinary

  const avatar = await uploadOnCloudinary(avatarLoacalPath)
  const coverImage = await uploadOnCloudinary(coverImagelocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file Required")
  }

  // Create entry in Database

  const user = await User.create({
    fullName, 
    email, 
    userName: userName.toLowerCase(), 
    password, 
    avatar: avatar.url, 
    coverImage: coverImage?.url || ""
  })

  // Checking If User is created 

  const createdUser = await User.findById(user).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while Registering The User")
  }

  // Sending response 
  res.status(201).json({
    new ApiResponse(201, createdUser, "user registered Succesfully",)

});

export { registerUser }