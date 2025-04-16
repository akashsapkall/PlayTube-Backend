import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './db/index.js';
import { configCloudinary } from"./utils/cloudinary.js";
dotenv.config();

connectDB()
.then(()=>{
    configCloudinary();
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Server is listening on port no ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.log("DATABASE CONNECTION FAILED !!!!!",error)
    process.exit(1);
})

// app.get('/',(req,res)=>{
//     res.send("sdgvjsf");
// })












// ;( async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on('error',(error)=>{
//             console.log('ERR:',error);
//             throw error;    
//         });
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server listening on ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("DATABASE CONNECTION FAILED: ",error);
//         throw error;
//     }
// })();