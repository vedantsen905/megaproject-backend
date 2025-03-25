import ApiError from '../utils/api_error.js';
import { asyncHandler} from '../utils/asyncHandler.js'
import { User}  from '../models/user.model.js'
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/api_response.js';
const registerUser = asyncHandler( async (req,res) => {

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
       

    const {fullname, email, username, password} = req.body
    console.log("email :" , email) ;
    console.log(" password :" , password) ;
    console.log("fullname :" , fullname) ;
    
    if (fullname === "") {
        throw new ApiError(400, "FullName is Required")
    }
    if (password === "") {
        throw new ApiError(400, "FullName is Required")
    }
        if (email === "" || !email.includes("@gmail.com")) {
            throw new ApiError(400, "email is Required")
        }
    if (username === "") {
        throw new ApiError(400, "username is Required")
    }
    

   const existedUser =  User.findOne({
        $or:[{username},{ email}]
    })
   
    if(existedUser) {
        throw new ApiError(409, "User with email or username already existed")

    }

   const avatarLocalPath =  req.files?.avatar[0]?.path ;

   const coverImageLocalPath = req.files?.coverImage[0] ?.path

   if(!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400, "avatar is required")
   }

 const user =  await User.create({
    fullname,
    avatar : avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id)
    .select(
        "-password -refreshToken "
    )

    if(!createdUser){
        throw new ApiError(500, "Something wnet wring while registering the user")

    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "Successfully registered")
    )



})

export  {registerUser}