import ApiError from "../utils/api_error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/api_response.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generating tokens:", error.message);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  //validation - not empty
  //check if user already exists from username email
  //check for images, check for avatar
  // uppload them to cloudinary, avatar
  // creare user object - create entry in db
  // remove password and refresh token field from response
  //check for usercreation
  //return response
  // if not generated then send error null

  const { fullname, email, username, password } = req.body;
  // console.log("email :" , email) ;
  // console.log(" password :" , password) ;
  // console.log("fullname :" , fullname) ;

  if (fullname === "") {
    throw new ApiError(400, "FullName is Required");
  }
  if (password === "") {
    throw new ApiError(400, "FullName is Required");
  }
  if (email === "" || !email.includes("@gmail.com")) {
    throw new ApiError(400, "email is Required");
  }
  if (username === "") {
    throw new ApiError(400, "username is Required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  //    const coverImageLocalPath = req.files?.coverImage[0] ?.path

  console.log("uploadided files", req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );

  if (!createdUser) {
    throw new ApiError(500, "Something wnet wring while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "Successfully registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  // algorithm desging
  // req body se data leke aao
  // username or email checking
  // find the user
  // password
  // access and referesh token
  //send cookies
  //send response

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "email or password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, " user does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password  -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "unauthorize request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "unauthorize error");
    }

    if (incomingToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token  is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshTOken: newrefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  // if(confPassword !==newPassword)

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, " Password saved"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetced successfully");
});



const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400 , "all fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname ,
                email
            }
        }  , {new :true}


    ).select("-password")

    return res
    .status(200)
    .json ( new ApiResponse(200 , user , 
        "Account details updated successfully"
    ))



})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLopcalPath = req.file?.path

    if(!avatarLopcalPath) {
        throw new ApiError(400, 
            "avatar file is missing"
        )}
    
   const avatar =  await uploadOnCloudinary(avatarLopcalPath)

   if(!avatar.url){
    throw new ApiError(400, 
        "avatar file is missing"
    )}

await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set : {
            avatar : avatar.url,

        }
    } ,{new:true}
)
.select('-password')

return res.status(200)
.json(new ApiResponse(200, "Avatar is updated successfully")
)

})

const updateCoverImage = asyncHandler(async(req,res) => {
    const  CoverImageLocalPath = req.file?.path

    if(!CoverImageLocalPath) {
        throw new ApiError(400, 
            "Cover Image  is missing"
        )}
    
   const CoverImage =  await uploadOnCloudinary(CoverImageLocalPath)

   if(!CoverImage.url){
    throw new ApiError(400, 
        "Cover Image is missing"
    )}

const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set : {
            coverImage : coverImage.url,

        }
    } ,{new:true}
)
.select('-password')

return res.status(200)
.json(new ApiResponse(200, "Cover image is updated successfully")
) 
    

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params

  if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
      {
          $match: {
              username: username?.toLowerCase()
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo"
          }
      },
      {
          $addFields: {
              subscribersCount: {
                  $size: "$subscribers"
              },
              channelsSubscribedToCount: {
                  $size: "$subscribedTo"
              },
              isSubscribed: {
                  $cond: {
                      if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                      then: true,
                      else: false
                  }
              }
          }
      },
      {
          $project: {
              fullName: 1,
              username: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1

          }
      }
  ])

  if (!channel?.length) {
      throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
  
})




export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar, 
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
