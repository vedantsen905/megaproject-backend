import { Router } from "express";
import { loginUser,
     logoutUser,
      refreshAccessToken, 
      registerUser ,
      changeCurrentPassword, 
      getCurrentUser, 
      updateUserAvatar, 
      updateUserCoverImage, 
      getUserChannelProfile, 
      getWatchHistory, 
      updateAccountDetails

} from "../controllers/user.controllers.js";
import multer from "multer";
import { upload } from "../middlewares/multer.middleware.js";
// import { ver, verifyJWtifyJWt } from "../middlewares/authentication.middleware.js";
import verifyJWt from '../middlewares/authentication.middleware.js'


const router = Router()
// const upload = multer()


router.route("/register").post(
    upload.fields([

    {
        name: "avatar",
        maxCount : 1
    }, {

        name : "coverImage",
        maxCount : 1
    }
]),
    registerUser)

    router.route("/login").post(loginUser)


    //secured routes

    router.route("/logout").post(verifyJWt, logoutUser)
    router.route('/refreshToken').post(refreshAccessToken)
    router.route("/change-password").post(verifyJWt, changeCurrentPassword)
router.route("/current-user").get(verifyJWt, getCurrentUser)
router.route("/update-account").patch(verifyJWt, updateAccountDetails)

router.route("/avatar").patch(verifyJWt, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWt, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWt, getUserChannelProfile)
router.route("/history").get(verifyJWt, getWatchHistory)

    

  
export default router