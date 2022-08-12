const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


app.use(cors());
app.use(express.json());







const uri = "mongodb+srv://OnlineBookStore:suD5wAadFKukGfoR@cluster0.u5nmk.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });

    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const bookCollections = client
      .db("BookStoreDatabase")
      .collection("book-collections");
    const userCollections = client.db("BookStoreDatabase").collection("users");
    const wishListCollections = client
      .db("BookStoreDatabase")
      .collection("wishList");
    const AddToCartCollection = client
      .db("AddToCart")
      .collection("cartProduct");

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollections.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    // get product
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = bookCollections.find(query);
      const books = await cursor.toArray();
      res.send(books);
    });

    app.post("/products", async (req, res) => {
      const newBook = req.body;
      const result = await bookCollections.insertOne(newBook);
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const singleBook = await bookCollections.findOne(query);
      res.send(singleBook);
    });

    app.post("/cartProduct", async (req, res) => {
      const product = req.body;
      const result = await AddToCartCollection.insertOne(product);
      res.send(result);
    });

    //user create , and add mongodb
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollections.updateOne(
        filter,
        updateDoc,
        options
      );

      const token = jwt.sign(
        { email: email },
        "0d295b70d05f82791065eef657f45ed4a493bbd384f8a06de0627ff553bcbf2ed9bf0f90331a226caa6ff1850bce8ab868677c1432fa6defb7dcc44bc2aa3d9a",
        { expiresIn: "1h" }
      );

      res.send({ result, token });
    });
    //get User
    app.get("/user", async (req, res) => {
      const query = {};
      const cursor = userCollections.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollections.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/cartProduct", async (req, res) => {
      const product = req.body;
      const query = { products: product.name };
      const exists = await AddToCartCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, product: exists });
      }
      const result = await AddToCartCollection.insertOne(product);
      res.send(product.success, result);
    });
    app.get("/cartProduct", async (req, res) => {
      const query = {};
      const cursor = AddToCartCollection.find(query);
      const books = await cursor.toArray();
      res.send(books);
    });
    // delete cart items
    app.delete('/cartProduct/:id', async(req,res)=>{
        const id =req.params.id;
        const query ={_id: ObjectId(id)};
        const result =await AddToCartCollection.deleteOne(query);
        res.send(result)
    })

    app.get("/categories", async (req, res) => {
      const category = req.query.category;
      const result = await bookCollections
        .find({ category: category })
        .toArray();
      res.send(result);
    });
    //wishList product add mongodb
    app.put("/wishList", async (req, res) => {
      const product = req.body;
      const filter = { name: product.name };
      console.log(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: product,
      };
      const result = await wishListCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // get wishList to mongodb
    app.get("/wishList", async (req, res) => {
      const query = {};
      const cursor = wishListCollections.find(query);
      const list = await cursor.toArray();
      res.send(list);
    });
     //wishList product add mongodb
     app.put('/wishList', async (req, res) => {
        const product=req.body;
        const filter = {name: product.name}
        console.log(filter);
        const options = { upsert: true };
        const updateDoc = {
          $set: product,
        };
        const result = await wishListCollections.updateOne(filter, updateDoc, options);
        res.send(result)
      })
    //delete wishlist
    app.delete('/wishList/:id', async(req,res)=>{
        const id =req.params.id;
        const query ={_id: ObjectId(id)};
        const result =await wishListCollections.deleteOne(query);
        res.send(result)
    })

    


    //search filter
    app.get("/product/", async (req, res) => {
      if (req.query.name) {
        const name = req.query.name;
        const matched = await bookCollections
          .find({ name: { $regex: name, $options: "i" } })
          .toArray();
        res.send(matched);
      } else {
        res.send(bookCollections);
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("our site is running properly");
});

app.listen(port, () => {
  console.log("listening to port", port);
});
