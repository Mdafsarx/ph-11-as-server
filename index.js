const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 2000;
// middleWare
app.use(cors({
  origin: ['http://localhost:5173', 'https://scintillating-meringue-0cb917.netlify.app'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PAS}@cluster0.zgmhkd0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}



const verifyToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded
      next()
    })
  }

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection

    const blogsData = client.db("blogsDB").collection('blogs');
    const wishlist = client.db("blogsDB").collection('wishlist');
    const comment = client.db("blogsDB").collection('comment');
    const User = client.db("blogsDB").collection('User');




    // blogs get
    app.get('/blogs', async (req, res) => {
      const search = req.query.search;
      const category = req.query.category;
      let query = {}
      if (search) { query = { title: { $regex: search, $options: "i" } } }
      if (category) query.category = category
      const cursor = blogsData.find(query).sort({ Date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/blog/:email', async (req, res) => {
      const filter = { email: req.params.email }
      const result = await blogsData.find(filter).toArray();
      res.send(result)
    })


    // blogs post
    app.post('/blogs', verifyToken, async (req, res) => {
      const tokenEmail = req.user.email
      const email = req.body.email
      if (tokenEmail !== email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const result = await blogsData.insertOne(req.body);
      res.send(result);
    })
    app.get('/blogs/:id', verifyToken, async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) }
      const result = await blogsData.findOne(filter);
      res.send(result)
    })
    app.put('/blog/:id', verifyToken, async (req, res) => {
      const tokenEmail = req.user.email
      const email = req.body.email
      // console.log(email,tokenEmail)
      if (tokenEmail !== email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          title: req.body.title,
          image: req.body.image,
          description: req.body.description,
          longDescription: req.body.longDescription,
          category: req.body.category,
        },
      };
      const result = await blogsData.updateOne(filter, updateDoc)
      res.send(result)
    })


    // comments 
    app.post('/comment', async (req, res) => {
      const result = await comment.insertOne(req.body);
      res.send(result);
    });
    app.get('/comment/:id', verifyToken, async (req, res) => {
      const cursor = comment.find({ ID: req.params.id });
      const result = await cursor.toArray();
      res.send(result);
    })


    // user api created here
    app.post('/user', async (req, res) => {
      const query = { email: req.body.email }
      const result = await User.findOne(query);
      if (result) { return res.send({ message: 'allReady inserted' }) }

      const user = await User.insertOne(req.body)
      res.send(user)
    })
    app.get('/user', async (req, res) => {
      const result = await User.find().toArray()
      res.send(result)
    })
    
    





    //  wishlists
    app.post('/wishlist', async (req, res) => {
      const result = await wishlist.insertOne(req.body);
      res.send(result);
    })
    app.get('/wishlist/:email', verifyToken, async (req, res) => {
      const tokenEmail = req.user.email
      const email = req.params.email
      if (tokenEmail !== email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const filter = { email: req.params.email }
      const cursor = wishlist.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    })
    app.delete('/wishlist/:id', async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await wishlist.deleteOne(query);
      res.send(result)
    })
    // cookies
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

      res.cookie("token", token, cookieOptions).send({ success: true });
    });
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);














app.get('/', (req, res) => {
  res.send('ph-11-as-server is running')
})


app.listen(port, () => {
  console.log('server running successful')
})