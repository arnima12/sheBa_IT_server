const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require("multer");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient,  ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {Server} = require("socket.io");

//middle wars
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
require('dotenv').config()

const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated secret key:', secretKey);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwroqof.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect((err) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
    return;
  }})
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // The uploaded files will be saved in the "uploads" folder
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });
  
app.get('/', (req, res) => {
  res.send('sheba Academy server is running');
});
async function run(){
  try{
    const coursesCollection = client.db('shebaAcademy').collection('courses');
    const liveClassCollection = client.db('shebaAcademy').collection('liveClasses');
    const usersCollection = client.db('shebaAcademy').collection('users');
    const profileCollection = client.db('shebaAcademy').collection('profiles');
    app.get('/courses',async(req,res)=>{
      const query = {};
      const cursor = coursesCollection.find(query);
      const courses = await cursor.toArray();
      res.send(courses);
    })
    app.get('/liveClasses',async(req,res)=>{
      const query = {};
      const cursor = liveClassCollection.find(query);
      const liveClasses = await cursor.toArray();
      res.send(liveClasses);
    })
    
    app.post('/users', async (req, res) => {
      const {fullName, phoneNumber, email,password,address} = req.body;
      // if (password !== req.body.confirmPassword) {
      //   return res.status(400).json({ message: 'Passwords do not match' });
      // }
      const user = {
        fullName,
        phoneNumber,
        email,
        password,
        address
      };
  
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get('/profile',async(req,res)=>{
      const query = {};
      const cursor = profileCollection.find(query);
      const profile = await cursor.toArray();
      res.send(profile);
    })
    app.post("/profile",async (req, res) => {
      
      const profile = req.body;
        console.log(profile);
        const result = await profileCollection.insertOne(profile);
        res.send(result);
    });
    
    
    // Route to handle image upload
    app.post("/upload-profile-image", upload.single("image"), async (req, res) => {
      try {
        // At this point, the image is uploaded and saved to the "uploads" folder
        // You can access the uploaded file details through req.file
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }
        
        // Construct the image URL to be sent back to the frontend
        const imageUrl = `http://localhost:${port}/${req.file.path}`;
        console.log("Image uploaded:", imageUrl);
        
        // Now you can save the imageUrl to your database or perform any other necessary operations
        
        // Send the image URL back to the frontend
        return res.json({ imageUrl });
    
      } catch (error) {
        console.error("Error uploading profile image:", error);
        return res.status(500).json({ error: "Something went wrong" });
      }
    });
}
    
  finally{

  }
}
run().catch(err => console.log(err));


  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

  });
  