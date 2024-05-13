const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 2000;

app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PAS}@cluster0.zgmhkd0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection

    const blogsData = client.db("blogsDB").collection('blogs');
    const wishlist = client.db("blogsDB").collection('wishlist');



    // blogs get
    app.get('/blogs', async (req, res) => {
      const search = req.query.search;
      const category=req.query.category;
      let query = {}
      if (search) {query = {title: { $regex: search, $options: "i" }}}
      if(category) query.category=category
      const cursor = blogsData.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    // blogs post
    app.post('/blogs', async (req, res) => {
      console.log(req.body)
      const result = await blogsData.insertOne(req.body);
      res.send(result);
    })



    //  wishlists
    app.post('/wishlist', async (req, res) => {
      const result = await wishlist.insertOne(req.body);
      res.send(result);
    })
    app.get('/wishlist/:email', async (req, res) => {
      console.log(req.params.email)
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