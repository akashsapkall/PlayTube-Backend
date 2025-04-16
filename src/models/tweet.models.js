import mongoose from "mongoose";
// import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true,
      index:true,
    },
  },
  { timestamps: true }
);
// commentSchema.plugin(aggregatePaginate);
export const Tweet = mongoose.model("Tweet", tweetSchema);
