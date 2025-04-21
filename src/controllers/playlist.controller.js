import mongoose from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name){
        throw new ApiError(400, "name required!!")
    }
    const playlist=await Playlist.create({
        name:name,
        description:description,
        videos:[],
        owner:req.user?._id,
    });
    if(!playlist){
        throw new ApiError(500,"Failed To Create Playlist!!");
    }
    return res.status(201)
    .json(new ApiResponse(201,playlist,"playlist created successfully!!"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"Invalid user Id!!")
    }
    const playlists=await Playlist.find({owner:userId});
    if(!playlists || playlists.length === 0){
        return res.status(200)
        .json(new ApiResponse(200,[], "No Playlist Found For This user!!"));
    }
    return res.status(200)
    .json(new ApiResponse(200,playlists,"playlists fetched successfully!!")); 
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!!")
    }
    const playlist=await Playlist.findById(playlistId)
    .populate("videos");
    // .populate("owner");
    if(!playlist){
        throw new ApiError(400,"No Playlist With The Id Exist!!")
    }
    return res.status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully!!"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Check video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Update playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        {_id:playlistId,
            owner:req.user._id,
        },
        { $addToSet: { videos: videoId } }, // Prevent duplicates
        { new: true } // Return updated document
    ).populate("videos"); // Get full video details

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found or unauthorized");
    }

    return res.status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!!")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id!!")
    }
    const removedVideo=await Playlist.findOneAndUpdate({_id:playlistId,
        owner:req.user._id,
    },{
        $pull:{
            videos:videoId,
        }
    },  
    {
        new:true
    }
    );
    if(!removedVideo){
        throw new ApiError(404,"Playlist Not Found or Unauthorized!!")
    }
    return res.status(200)
    .json(new ApiResponse(200, removedVideo, "Video removed Successfully!!"));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!!")
    }
    const deletedPlaylist=await Playlist.findOneAndDelete({_id:playlistId,
        owner:req.user._id,
    });
    if(!deletedPlaylist){
        throw new ApiError(404,"Playlist not found or unauthorized!!")
    }
    return res.status(200)
    .json(new ApiResponse(200, deletedPlaylist, "playlist deleted Successfully!!"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!!")
    }
    const updatedPlaylist=await Playlist.findOneAndUpdate({_id:playlistId,owner:req.user._id},
        {
            $set:{
                name:name,
                description:description,
            }
        },
        { new: true}
    );
    if(!updatedPlaylist){
        throw new ApiError(404,"Playlist not found or unauthorized!!")
    }
    return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully!!"));

});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}