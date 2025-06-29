
const mongoose = require("mongoose");
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type:String,
        required:true,
        minLength:2,
        maxLength:28,
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:28,
    },
    emailId:{
     type:String,
     required:true,
     unique:true,
     trim:true,
     lowercase:true,
     immutable:true
    },
    password:{
        type:String,
        required:true,
        minLength:3,
        maxLength:100,
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user',
    },
    problemSolved:{
        type:String,
    }
},{
    timestamps:true
})

const User = mongoose.model("user",userSchema);

module.exports = User;