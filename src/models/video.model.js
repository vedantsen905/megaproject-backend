import mongoose from "mongoose";
import mongooseAggregatePaginate from 
"mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema({
    videoFile : {
        type: String , //clouniary url
        required:true
    } 
    ,

    thumbnail : {
        type:String, //cloudinary url
        required:true
    } ,

    title : {
        type:String,
        required:true}
        ,

    description : {
        type:String,
        required:true
    },

    time : {
        type : Number, //cllouinary url
        required

    },

    view : {
        type :Number,
        default:0
    }, 
    isPublished : {
        type: Boolean,
      
        default:true
    }, 

    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
    }

}, {
    timestamps:true
})


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema) 