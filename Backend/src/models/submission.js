const { error } = require("console");
const mongoose = require("mongoose");
const { type } = require("os");
const { memo } = require("react");
const{Schema} = mongoose;

const submissionSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    problemId:{
        type:Schema.Types.ObjectId,
        ref:"Problem",
        required:true
    },
    code:{
        type:String,
        required:true   
    },
    language:{
        type:String,
        enum:["c++", "java", "javascript"],
        required:true
    },
    status:{
        type:String,
        enum:["pending", "accepted", "wrong", "error"],
        default:"pending"
    },
    runtime:{
        type:Number,//ms
        default:0
    },
    memory:{
        type:Number,//kb
        default:0
    },
    errorMessage:{
        type:String,
        default:""
    },
    testCasesPassed:{
        type:Number,
        default:0
    },

})

const Submission = mongoose.model('submission',submissionSchema);

module.exports =Submission;