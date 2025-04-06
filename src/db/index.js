import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Database Connection Success!!");
        console.log("CONNECTION HOST: ",connectionInstance.connection.host);
        return connectionInstance;
    } catch (error) {
        console.log("DATABASE CONNECTION FAILED :",error);
        process.exit(1);
    }
}
export default connectDB;