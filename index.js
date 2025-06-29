const express=require("express");
const app = express();
require('dotenv').config();
const main = require("./src/config/db")
const cookie_parser=require ('cookie-parser');
const authRouter = require("./src/routes/userAuth")

app.use(express.json());
app.use(cookie_parser());
app.use("/user",authRouter);

main()
.then(async ()=>{
    app.listen(process.env.PORT,()=>{
    console.log("Server listening at port number : "+process.env.PORT);
})
})
.catch(err=>console.log("Error Ocuured")
)
