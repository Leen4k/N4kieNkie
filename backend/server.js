require('dotenv').config(); // to access dot env variable
const bcrypt = require('bcryptjs'); // to encrypt password
const express = require('express');
const app = express();
const port = 3168
const cors = require('cors'); //let the client access our api
const mongoose = require('mongoose'); //mongoose for connecting to the mongodb database
const User = require("./models/User.js")  // call the user model file
const jwt = require("jsonwebtoken")
const jwtSecret = "afhlafi32423oi4"
const cookieParser = require('cookie-parser');

 
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
    credentials: true,
    origin: "http://localhost:3000"
})) ;


mongoose.connect(process.env.MONGO_URL) // connect to the mongodb database

app.get('/', (req, res) => {
    res.send("b sl o");
    res.status(200).json("yayy");
})

app.post('/register', async (req,res)=>{ 
    try{
        const {name,email,password} = req.body;
        const bcryptSalt = await bcrypt.genSalt(10); 
        const userDoc = await User.create({
            name, 
            email,
            password:bcrypt.hashSync(password,bcryptSalt) 
        })
        res.json(userDoc) 
    }catch(e){
        res.status(422).json(e);
    }
})

app.post('/login', async (req, res)=>{
    const {email,password} = req.body;
    const userDoc = await User.findOne({email})

    if(userDoc){
        const passOk = bcrypt.compareSync(password, userDoc.password )

        if(passOk){
            jwt.sign({email:userDoc.email, id:userDoc.id, name:userDoc.name}, jwtSecret, {}, (err,token) => {
                if(err) throw err;
                res.cookie("token",token).json(userDoc)
            } )
             
        }else{ 
            res.status(422).json("wrong password")
        }
    }else{
        res.status(422).json("user not found");
    }
})

app.get("/profile", (req, res)=>{
    const {token} = req.cookies; 
    if(token){
        jwt.verify(token, jwtSecret, {}, async (err,userData) => {
            if(err) throw err;
            const {name,email,_id} = await User.findById(userData.id);
            res.json({name,email,_id});
        })
    }else{
        res.json(null);
    }
})

//logout
app.post("/logout",(req,res) => {
    res.cookie("token", "").json(true);
})

app.listen(port,(req,res)=>{
    console.log(`listening on port ${port} on the mix`)
});  