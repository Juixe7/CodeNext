const express = require('express')
require('dotenv').config();
const app = express();
const cors=require('cors');
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const {submissionRouter} =require("./routes/submit");

app.use(express.json());
app.use(cookieParser());
// ...existing code...
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// ...existing code...
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submissionRouter);


const InitalizeConnection = async ()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        
        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();

