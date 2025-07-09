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

// Allow local dev and deployed Vercel frontend
const allowedOrigins = [
    'http://localhost:5173',
    'https://coderoad-frontend-fowp7z2sl-akhils-projects-7c00dc14.vercel.app'
];

app.set('trust proxy', 1);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
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

