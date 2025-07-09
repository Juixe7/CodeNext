const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')

// console.log("Hello")

app.use(cors({
    origin: 'http://localhost:5173',
    
    credentials: true 
}))

app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);


const InitalizeConnection = async ()=>{
    try{
        await main();
        console.log("DB Connected");

        // connect to redis but don't block server start
        redisClient.connect().then(()=>{
            console.log("Redis connected");
        }).catch((err)=>{
            console.error("Redis connect error:", err && err.message ? err.message : err);
        });

        redisClient.on('reconnecting', ()=>{
            console.warn("Redis reconnecting...");
        });
        redisClient.on('ready', ()=>{
            console.log("Redis ready");
        });

        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();

