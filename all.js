const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require("fs");

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Server } = require('socket.io');
const path = require('path');

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
require('dotenv').config();

const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated secret key:', secretKey);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwroqof.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, "uploads/");
    fs.mkdirSync(destinationPath, { recursive: true }); // Create the 'articles' directory if it doesn't exist
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


const upload = multer({ storage: storage }).fields([
  { name: "video", maxCount: 1 },

]);
async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const coursesCollection = client.db('shebaAcademy').collection('courses');
    const liveClassCollection = client.db('shebaAcademy').collection('liveClasses');
    const usersCollection = client.db('shebaAcademy').collection('users');
    const profileCollection = client.db('shebaAcademy').collection('profiles');
    const videosCollection = client.db('shebaAcademy').collection('videos');

    app.get('/', (req, res) => {
      res.send('Sheba Academy server is running');
    });

    app.get('/courses', async (req, res) => {
      const query = {};
      const cursor = coursesCollection.find(query);
      const courses = await cursor.toArray();
      res.send(courses);
    });

    app.get('/liveClasses', async (req, res) => {
      const query = {};
      const cursor = liveClassCollection.find(query);
      const liveClasses = await cursor.toArray();
      res.send(liveClasses);
    });

    app.post('/users', async (req, res) => {
      const { fullName, phoneNumber, email, password, address } = req.body;
  
      const user = {
        fullName,
        phoneNumber,
        email,
        password,
        address,
      };

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/profile', async (req, res) => {
      const query = {};
      const cursor = profileCollection.find(query);
      const profile = await cursor.toArray();
      res.send(profile);
    });

    app.post('/profile', async (req, res) => {
      const profile = req.body;
      console.log(profile);
      const result = await profileCollection.insertOne(profile);
      res.send(result);
    });


    //vdo 
    app.get("/videos", async (req, res) => { 
      const cursor = videosCollection.find({});
      const videos = await cursor.toArray();
      res.send(videos);
    })
    app.post("/videos", (req, res) => {
      upload(req, res, async (error) => {
        if (error) {
          console.error(error);
          return res.status(400).send({ message: "Error uploading files" });
        }

        const { title, description } = req.body;
        const videoFile = req.files["video"][0];

        // Check if the video file exists before uploading
        const videoFilePath = path.join(
          __dirname,
          "uploads/",
          videoFile.filename
        );

        if (!fs.existsSync(videoFilePath)) {
          console.error("Video file not found");
          return res.status(400).send({ message: "Video file not found" });
        }

        const video = {
          title,
          description,
          video: videoFile.filename,
        };

        const result = await videosCollection.insertOne(video);
        console.log(result);
        res.json(result);
      });
    });

    // Serve the video files statically from the 'articles' directory
    app.use("/videos", express.static(path.join(__dirname, "uploads")));
    // To get a specific video
    app.get("/uploads/videos/:filename", (req, res) => {
      const { filename } = req.params;
      const filePath = path.join(__dirname, "uploads", filename);

      if (!fs.existsSync(filePath)) {
        console.error("Video file not found");
        return res.status(404).send({ message: "Video file not found" });
      }

      res.contentType("video/mp4"); // Update the content type based on your video format
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
