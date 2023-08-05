const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require("fs");
const { ObjectId } = require('mongodb'); // Make sure you import ObjectId from the MongoDB driver.
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
    cb(null, "uploads/"); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename for the uploaded video
  },
});

const upload = multer({ storage: storage }).fields([{ name: 'videos', maxCount: 10 }]);

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const liveClassCollection = client.db('shebaAcademy').collection('liveClasses');
    const usersCollection = client.db('shebaAcademy').collection('users');
    const profileCollection = client.db('shebaAcademy').collection('profiles');
    const videosCollection = client.db('shebaAcademy').collection('videos');

    app.get('/', (req, res) => {
      res.send('Sheba Academy server is running');
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
    // ... (other imports and configurations)

    app.use("/videos", express.static(path.join(__dirname, "uploads")));// Change the destination folder as per your requirement

    app.post("/videos", upload, async (req, res) => {
      try {
        const { name, description } = req.body;
    
        // Check if any video files were uploaded
        if (!req.files || !req.files['videos']) {
          console.error("No video files were uploaded");
          return res.status(400).send({ message: "No video files were uploaded" });
        }
    
        const videoFiles = req.files['videos'].map((file) => file.filename);
    
        // Insert the video filenames as an array under the same "name" and "description"
        const videoObject = {
          name,
          description,
          videos: videoFiles,
        };
    
        // Insert the videoObject into the database
        const result = await videosCollection.insertOne(videoObject);
        console.log(result);
        res.json(result);
      } catch (error) {
        console.error('Error uploading videos:', error);
        res.status(500).json({ error: 'Failed to upload videos' });
      }
    });
    
    
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
    

    
    // Get single video details API
    app.get("/videos/:id", async (req, res) => {
      try {
        const id = req.params.id;
    
        // Make sure the provided ID is a valid hexadecimal string
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid video ID' });
        }
    
        const query = { _id: new ObjectId(id) };
        const video = await videosCollection.findOne(query);
        if (!video) {
          return res.status(404).json({ error: 'Video not found' });
        }
        const videos = video.videos;

        res.json(video);
      } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).json({ error: 'Failed to fetch video details' });
      }
    });
    

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
