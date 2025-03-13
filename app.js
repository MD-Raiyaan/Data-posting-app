const express=require('express');
const app=express();
const path=require('path');
const usermodel=require('./models/user');
const postmodel=require('./models/post');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const user = require('./models/user');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(path.join('public')));
app.use(cookieParser());

app.get('/',async (req,res)=>{
     let valid=( typeof(req.cookies.token)==="undefined" || req.cookies.token === "")?false:true;
     let posts=await postmodel.find().populate('user');
     res.render('index',{valid,posts});
})

app.get('/signup',(req,res)=>{
     res.render('signup');
})

app.post('/register',async (req,res)=>{
     let {email,name,age,username,password}=req.body;
     let user=await usermodel.findOne({email});
     if(user!=null)return res.redirect("/login");
     bcrypt.genSalt(10,(err,salt)=>{
         bcrypt.hash(password,salt,async (err,hash)=>{
                let userdata = await usermodel.create({username,name,age,email,password:hash});
                let token=jwt.sign({email,userid:userdata._id},"secret");
                res.cookie('token',token);
                res.redirect('/');
         })
     })
})

app.get('/login',(req,res)=>{
      res.render('login');
})

app.post('/login',async (req,res)=>{
    if (typeof req.cookies.token != "undefined" && req.cookies.token != "")return res.redirect("/");
    let {email,password}=req.body;
    let user = await usermodel.findOne({ email });
    if(!user)return res.redirect('/signup');
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result==false)return res.redirect("/login");
        else{
             let token = jwt.sign({ email, userid: user._id }, "secret");
             res.cookie("token", token);
             res.redirect('/');
        }
    })
})

app.get('/logout',async (req,res)=>{
    res.cookie('token',"");
    res.redirect('/');
})

let isloggedin=function(req,res,next){
    if( typeof(req.cookies.token)==="undefined" || req.cookies.token === "")return  res.redirect('/login');
    else{
        let data=jwt.verify(req.cookies.token,"secret");
        req.user=data;
        next();
    }
}
app.get('/profile',isloggedin,async (req,res)=>{
    let user=await usermodel.findOne({_id:req.user.userid}).populate("post");
    console.log(user);
    res.render("profile",{user});
})

app.post('/post',isloggedin,async (req,res)=>{
     let {content}=req.body;
     let user=await usermodel.findOne({email:req.user.email});
     let post=await postmodel.create({data:content,user:user._id});
     user.post.push(post._id);
     await user.save();
     res.redirect('/profile');
})


app.listen(3000,()=>{
    console.log("running successfully!!!");
})