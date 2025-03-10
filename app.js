const express=require('express');
const app=express();
const path=require('path');
const usermodel=require('./models/user');
const postmodel=require('./models/post');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(path.join('public')));
app.use(cookieParser());

app.get('/',(req,res)=>{
     res.render('index');
})

app.post('/register',async (req,res)=>{
     let {email,name,age,username,password}=req.body;
     let user=await usermodel.findOne({email});
     if(user!=null)return res.status(500).send("email already exists !!");
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
    if (req.cookies.token != "")return res.status(500).send("already logged in");
    let {email,password}=req.body;
    let user = await usermodel.findOne({ email });
    if(!user)return res.status(500).send("Something went wrong!!!");
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result==false)return res.status(500).send("Incorrect password");
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
    console.log(req.cookies);
    if(req.cookies.token === "" || !req.cookies)return  res.redirect('/login');
    else{
        let data=jwt.verify(req.cookies.token,"secret");
        req.user=data;
        next();
    }
}
app.get('/profile',isloggedin,(req,res)=>{
    console.log(req.user);
    res.render("profile");
})


app.listen(3000,()=>{
    console.log("running successfully!!!");
})