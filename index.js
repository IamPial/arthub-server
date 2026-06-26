const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    console.log(req.user);
    next();
  } catch (error) {
    console.error("Token validation failed:", error);
    throw error;
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("arthub_db");
    const userCollection = db.collection("user");
    const artworksCollection = db.collection("artworks");

    //all artworks
    app.get("/api/all-artworks", async (req, res) => {
      const { search, category, minPrice, maxPrice, sortBy } = req.query;
      let query = {};

      //for name or title searching
      if (search && search != "undefined") {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
        ];
      }

      //for category searching
      if (category && category != "undefined") {
        query.category = { $regex: category, $options: "i" };
      }

      //for min or max price searching
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }

      //for searching with lowest price or highest price
      let newestData = { createdAt: -1 };
      if (sortBy === "price-low")
        newestData = {
          price: 1,
        };

      if (sortBy === "price-high") newestData = { price: -1 };

      const result = await artworksCollection.find(query).toArray();
      res.send(result);
    });

    //add artworks related apis
    app.get("/api/artworks", verifyToken, async (req, res) => {
      const userId = req.user.id;
      const result = await artworksCollection.find({ userId }).toArray();
      res.send(result);
    });

    app.post("/api/artworks", verifyToken, async (req, res) => {
      const artWorkData = req.body;
      const result = await artworksCollection.insertOne(artWorkData);
      res.send(result);
    });

    app.patch("/api/artworks/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await artworksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData },
      );
      res.send(result);
    });

    app.delete("/api/artworks/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await artworksCollection.deleteOne({
        _id: new ObjectId(id),
      });
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
