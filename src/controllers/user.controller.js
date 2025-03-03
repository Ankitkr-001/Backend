import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Saving refreshToken in Database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
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

  const { email, userName, password } = req.body;

  // if ((!userName && !email)) {
  //   throw new ApiError(400, "username or password is required");
  // }
  if (!(userName || email)) {
    throw new ApiError(400, "username or password is required");
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

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    " -password  -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = await User.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }
  
    if (refreshAccessToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or Used");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    const { newRefreshToken, accessToken } = await generateAccessAndRefreshToken(
      user?._id,
      options
    );
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400 , error?.message || "Invalid Refresh Token")
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
