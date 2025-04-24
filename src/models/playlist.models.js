import mongoose from "mongoose";
// import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    status:{
      type:String,
      default:'PRIVATE',
      enum:['PUBLIC','PRIVATE']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
// commentSchema.plugin(aggregatePaginate);
export const Playlist = mongoose.model("Playlist", playlistSchema);
