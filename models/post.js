const mongoose=require('mongoose');
const user = require('./user');

mongoose.connect("mongodb://localhost:27017/mini-project");

const postschema= mongoose.Schema({
     data:String,
     user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
     },
     date:{
        type:Date,
        default:Date.now
     }
});

module.exports=mongoose.model('post',postschema);