const express = require('express');
const app = express();
const port = 3168
const cors = require('cors');

app.use(cors({
    credentials: true,
    origin: "http://localhost:3000"
}));
// app.use(cors());

app.get('/', (req, res) => {
    res.send("b sl o");
    res.status(200).json("yayy");
})

app.listen(port,(req,res)=>{
    console.log(`listening on port ${port} on the mix`)
});