const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({


username:{
    type:String,
    unique:[true , "user name already taken"],
    required:true
},
email:{
    type:String,
    unique:[true , "email already exits"],
    required:true
},
password:{
    type:String,
    required:true
},



} , {timestamps:true})

const userModel = mongoose.model("user" , userSchema)

module.exports = userModel