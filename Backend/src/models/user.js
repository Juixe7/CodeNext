const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type: String,
        required: true,
        minLength:3,
        maxLength:20
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20,
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim: true,
        lowercase:true,
        immutable: true,
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default: 'user'
    },
    problemSolved:{
        type:[
            {
                type:Schema.Types.ObjectId,
                ref:'problem'
            }
        ],
        unique:true
    },
    bookmarkedProblems:[{
        type:Schema.Types.ObjectId,
        ref:'problem'
    }],
    streak:{
        type:Number,
        default:0
    },
    lastActiveDate:{
        type:Date,
        default:null
    },
    eloRating: {
        type: Number,
        default: 1200
    },
    battleWins: {
        type: Number,
        default: 0
    },
    battleLosses: {
        type: Number,
        default: 0
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    password:{
        type:String,
        required: true
    }
},{
    timestamps:true
});


const User = mongoose.model("user",userSchema);

module.exports = User;
