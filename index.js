const express=require("express");
const app = express();
require('dotenv').config();
const main = require("./src/config/db")
const cookie_parser=require ('cookie-parser');
const authRouter = require("./src/routes/userAuth")
const redisClient = require("./src/config/redis")

app.use(express.json());
app.use(cookie_parser());
app.use("/user",authRouter);

const InitialiseConnection = async() =>{
    try {
        await Promise.all([main(),redisClient.connect()]);
        console.log("DB connected!");

         app.listen(process.env.PORT,()=>{
    console.log("Server listening at port number : "+process.env.PORT);
    })
    } catch (error) {
        console.log("Error"+error);
    }
}

InitialiseConnection();
// main()
// .then(async ()=>{
//     app.listen(process.env.PORT,()=>{
//     console.log("Server listening at port number : "+process.env.PORT);
// })
// })
// .catch(err=>console.log("Error Ocuured")
// )
