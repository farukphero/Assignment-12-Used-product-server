const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8uhbkvb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized Access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      res.status(403).send({ message: " forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoryCollection = client.db("usedProductResale").collection("categories");
    const productsCollection = client.db("usedProductResale").collection("products");
    const usersCollection = client.db("usedProductResale").collection("users");
    const bookingsCollection = client.db("usedProductResale").collection("bookings");

    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const categories = await cursor.toArray();
      res.send(categories);
    });
    app.get("/products/:category", async (req, res) => {
      const category = req.params.category;
      const query = {category: category};
      const result =await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/products", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if ( email !== decodedEmail) {
        return res.status(403).send("Forbidden Access");
      }
      const query = { email: email };
      const newProducts = await productsCollection.find(query).sort({ _id: -1 }).toArray();
      res.send(newProducts);
    });

    app.post("/products", async (req, res) => {
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      products.id = result.insertedId;
      res.send(result);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        })
        return res.send({ accessToken: token });
      }
      res.status(403).send({ message: "forbidden" });
    });

    app.get('/users', async(req, res)=>{
     const query = {}
     const users = await usersCollection.find(query).toArray()
     res.send(users)

    });
    app.get('/sellers/:category', async(req, res)=>{
      const category = req.params.category;
      const query = {category: category}
     const users = await usersCollection.find(query).toArray();
     res.send(users)

    });
    app.get('/buyers/:category', async(req, res)=>{
      const category = req.params.category;
      const query = {category: category}
     const users = await usersCollection.find(query).toArray();
     res.send(users)

    });

    app.get('/users/admin/:email', async (req, res)=>{
      const email = req.params.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.role === 'admin'})
    })
    app.get('/users/seller/:email', async (req, res)=>{
      const email = req.params.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      res.send({isSeller: user?.category === 'seller'})
    })
    app.get('/users/buyer/:email', async (req, res)=>{
      const email = req.params.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      res.send({isBuyer: user?.category === 'buyer'})
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.put('/users/admin/:id', verifyJWT, async (req, res)=>{
      const decodedEmail = req.decoded.email;
      const query = {email: decodedEmail};
      const user = await usersCollection.findOne(query)
      if(user?.role !== 'admin'){
        return res.status(403).send({message: ' forbidden access'})
      }
     const id = req.params.id;
     const filter = {_id : ObjectId(id)}
     const options = {upsert : true};
     const updatedDoc = {
      $set:{
        role: 'admin'
      }
     }
     const result = await usersCollection.updateOne(filter, updatedDoc, options)
     res.send(result)

    });

    app.get("/bookings", async (req, res) => {
      const query ={}
      const result = await bookingsCollection.find(query).toArray();
      // console.log(user, result)
      res.send(result);
    }); 

    app.post("/bookings", async (req, res) => {
      const user = req.body;
      const result = await bookingsCollection.insertOne(user);
      // console.log(user, result)
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.log(error));

app.get("/", async (req, res) => {
  res.send("used product resale server running");
});
app.listen(port, () => console.log(`Resale product running ${port}`));
