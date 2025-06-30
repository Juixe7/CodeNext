const express=require('express');//to create a router
const authRouter=express.Router();
const {register,login,logout, adminRegister}=require("../controllers/userAuthenticate");
const userMiddleware=require("../middleware/userMiddleware")
const adminMiddleware=require("../middleware/adminMiddleware")
//register
authRouter.post('/register',register);

//login
authRouter.post('/login',login);

//logout
authRouter.post('/logout',userMiddleware,logout);

authRouter.post("/admin/register",adminMiddleware,adminRegister);

// //Getprofile
// authRouter.get('/getProfile',getProfile);

module.exports = authRouter;
