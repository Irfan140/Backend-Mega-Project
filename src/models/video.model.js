import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // from cloudinary url
            required: true // for any default message use an array format like [true, "Any message"]
        },
        thumbnail: {
            type: String, // from cloudinary url
            required: true
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    }, 
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)


/*
1. Aggregation queries are like advanced searches in the database. They let you group, filter, or calculate data in complicated ways, such as finding the total views for all videos by a user or sorting videos by popularity.

2. The mongoose-aggregate-paginate-v2 plugin makes it easy to break these large search results into smaller, manageable chunks (pages). This is useful when you want to show results one page at a time, like displaying 10 videos per page on a website.


*/