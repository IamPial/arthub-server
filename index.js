const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Server Running On!!");
});

const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("arthub_db");
    const userCollection = db.collection("user");
    const artworksCollection = db.collection("artworks");

    //add artworks related apis

    app.get("/api/artworks", async (req, res) => {
      const result = await artworksCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/artworks", async (req, res) => {
      const artWorkData = req.body;
      const result = await artworksCollection.insertOne(artWorkData);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
