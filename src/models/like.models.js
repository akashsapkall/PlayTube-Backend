import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    // Reference to the user who performed the like action
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Polymorphic reference to the content being liked
    likeable: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "onModel", // Dynamic reference based on the value of `onModel`
    },

    // Specifies the type of content being liked
    onModel: {
      type: String,
      required: true,
      enum: ["Video", "Comment", "Tweet"], // Add other types as needed
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);
likeSchema.index({ likeable: 1, onModel: 1 }); // Optimized for content queries
likeSchema.index({ owner: 1 }); // Optimized for user-centric queries
export const Like = mongoose.model("Like", likeSchema);

// import mongoose from "mongoose";
// // import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// const likeSchema = new mongoose.Schema(
//   {
//     video: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Video",
//     },
//     comment: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Comment",
//     },
//     tweet: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Tweet",
//     },
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );
// // commentSchema.plugin(aggregatePaginate);
// export const Like = mongoose.model("Like", likeSchema);

