import mongoose ,{ Schema, model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile : {
            type : String,  // Clodniary url
            required : true
        },
        thumbnail : {
            type : String,
            required : true
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : Number, // Get From cludnary
            required : true
        },
        views : {
            type : Number,
            default : 0
        },
        isPublushed : {
            type : Boolean,
            default : true
        },
        owner : {
            type : Schema.Types.ObjectId, // Reference to user model
            ref : "User"
        }
    },
    {
        timestamps: true
    })


videoSchema.plugin(mongooseAggregatePaginate)    

export const Video = model("Video",videoSchema)