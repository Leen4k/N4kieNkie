require('dotenv').config(); // to access dot env variable
const bcrypt = require('bcryptjs'); // to encrypt password
const express = require('express');
const app = express();
const port = 3168
const cors = require('cors'); //let the client access our api
const mongoose = require('mongoose'); //mongoose for connecting to the mongodb database
const User = require("./models/User.js")  // call the user model file
const Place = require("./models/Place.js")
const jwt = require("jsonwebtoken")
const jwtSecret = "afhlafi32423oi4"
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');

 
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname+ "/uploads"))
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

//upload link
app.post("/upload-via-link", async (req, res) => {
    const {link} = req.body;
    const newName = "photo" + Date.now() + ".jpg";
    await imageDownloader.image({
        url: link,
        dest: __dirname + "/uploads/" + newName  
    });
    res.json(newName);
})


const photosMiddleware = multer({dest:"uploads/"}); 
//upload image
app.post("/upload",photosMiddleware.array("photos", 100) ,async (req, res) => {
    let uploadedFiles = [];
    console.log(req.files); 
    for(i=0; i<req.files.length; i++){
        const {path, originalname} = req.files[i];
        const parts = originalname.split(".");
        const ext = parts[parts.length - 1]; 
        const newPath = path + "." + ext;
        fs.renameSync(path, newPath);
        uploadedFiles = [...uploadedFiles, newPath.replace("uploads/","")];
    }
    res.json(uploadedFiles);
})

//places
app.post("/places", async (req, res) => {
    const {token} = req.cookies;
    const {title, address, addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price} = req.body;
    jwt.verify(token, jwtSecret, {}, async (err,userData) => {
        if(err) throw err;
        const placeDoc = await Place.create({
                owner: userData.id,
                title, address, photos:addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price
            }) 
            res.json(placeDoc);
        })  
})

//get a specific places from a user
app.get("/user-places",(req,res) =>{
    const {token} = req.cookies;
    console.log(token)
    jwt.verify(token, jwtSecret, {}, async (err,userData) => {
        const {id} = userData;
        res.json( await (Place.find({owner:id})))
    });
} )

app.get("/places/:id", async (req,res) =>{
    const {id} = req.params;
    res.json(await Place.findById(id));
})

app.put("/places", async (req,res) =>{
    const {token} = req.cookies;
    const {id, title, address, addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price} = req.body;

    jwt.verify(token, jwtSecret, {}, async (err,userData) => {
        if (err) throw err;
        const placeDoc = await Place.findById(id);
        if(userData.id === placeDoc.owner.toString()){
            placeDoc.set({
                title, address, photos:addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price
            });
            await placeDoc.save();
            console.log(price)
            res.status(200).json("ok");
        }
        
    });

});

// get all the places
app.get("/places", async (req,res) => {
    res.json(await Place.find());
})


app.listen(port,(req,res)=>{
    console.log(`listening on port ${port} on the mix`)
});   