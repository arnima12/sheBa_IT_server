const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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
  const io = new Server({
cors:true,
  })
  const emailToSocketMapping = new Map();
  io.on("connection", (socket) =>{
    console.log("New Connection")
    socket.on('join-class',data=>{
      console.log("user",email)
      const {roomId, email} =data;
      emailToSocketMapping.set(email,socket.id);
      socket.join(roomId);
      socket.broadcast.to(roomId).emit('user-joined',{email});
    })
  })
app.get('/', (req, res) => {
  res.send('sheba Academy server is running');
});
async function run(){
  try{
    const coursesCollection = client.db('shebaAcademy').collection('courses');
    const liveClassCollection = client.db('shebaAcademy').collection('liveClasses');
    const usersCollection = client.db('shebaAcademy').collection('users')
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
    // app.post('/signUp', async (req, res) => {
    //   const { fullName, email, password, phoneNumber, confirmPassword, address } = req.body;
    
    //   try {
    //     // Check if the password and confirm password match
    //     if (password !== confirmPassword) {
    //       return res.status(400).json({ message: 'Password and confirm password do not match' });
    //     }
    
    //     // Hash the password
    //     const saltRounds = 10;
    //     const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    //     // Create the user object with the hashed password
    //     const user = {
    //       fullName,
    //       email,
    //       passwordHash: confirmPassword,
    //       phoneNumber,
    //       address
    //     };
    
    //     // Insert the user into the database
    //     usersCollection.insertOne(user, (err) => {
    //       if (err) {
    //         console.error('Error inserting user:', err);
    //         return res.status(500).json({ message: 'Registration failed' });
    //       }
    
    //       res.json({ message: 'Registration successful!' });
    //     });
    //   } catch (error) {
    //     console.error('Error during registration:', error);
    //     res.status(500).json({ message: 'Registration failed' });
    //   }
    // });
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
    
}
    
  finally{

  }
}
run().catch(err => console.log(err));


  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

  });
  io.listen(5001)