import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async () => {
  try {

    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Saving refreshToken in Database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });  
    return { accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong While creating Access And refresh Token"
    );
  }
};


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

  const { fullName, email, userName, password } = req.body;

  // validationg non empty
  // if (fullName === "") {
  //   throw new ApiError(400, "Full name is required")
  // }

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Checking For existed user
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exist");
  }

  // Checking For image

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log("Request Body:", req.body);
  // console.log("Uploaded File:", req.files);

  // const coverImagelocalPath = req.files?.coverImage[0]?.path;

  let coverImagelocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar image is required");
  }

  // Upload to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImagelocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file Required");
  }

  // Create entry in Database

  const user = await User.create({
    fullName,
    email,
    userName: userName.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // Checking If User is created

  const createdUser = await User.findById(user).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while Registering The User");
  }

  // Sending response
  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "user registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from frontend
  // login With username or pass
  // Check if user existed
  // Check for password
  // access and refresh token
  // send cookies
  //  resposne send

  const { email, userName, password } = req.body();

  if (!userName || !email) {
    throw new ApiError(400, "username of password is required");
  }

  // Finding user in stored database using email or pass
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "user Does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)






});

export { registerUser, loginUser };
