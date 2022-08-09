const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());





const uri = "mongodb+srv://OnlineBookStore:suD5wAadFKukGfoR@cluster0.u5nmk.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const bookCollections = client.db("BookStoreDatabase").collection("book-collections");
        const userCollections = client.db("BookStoreDatabase").collection("users");
        const AddToCartCollection=client.db("AddToCart").collection("cartProduct")
        // get product 
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = bookCollections.find(query);
            const books = await cursor.toArray();
            res.send(books)
        })

        app.post("/products", async (req, res) => {
            const newBook = req.body;
            const result = await bookCollections.insertOne(newBook);
            res.send(result);
          });

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singleBook = await bookCollections.findOne(query);
            res.send(singleBook);
        });

        //user create and add mongodb
        app.put('/user/:email', async(req,res)=>{
            const email = req.params.email;
            const user =req.body
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
              };
              const result = await userCollections.updateOne(filter, updateDoc, options);

              const token =jwt.sign({email:email},"0d295b70d05f82791065eef657f45ed4a493bbd384f8a06de0627ff553bcbf2ed9bf0f90331a226caa6ff1850bce8ab868677c1432fa6defb7dcc44bc2aa3d9a",{ expiresIn: '1h' })

              res.send({result, token});
        })
        //get User
        app.get('/user', async (req, res) => {
            const query = {};
            const cursor =userCollections.find(query);
            const users = await cursor.toArray();
            res.send(users)
        })


        app.post('/cartProduct', async (req, res)=>{
            const product=req.body;
            console.log(product);
            const query = {products: product.bookName}
            console.log(query);
            const exists = await AddToCartCollection.findOne(query);
            if(exists){
                return res.send({success: false, product:exists})
            }
            const result= await AddToCartCollection.insertOne(product)
            res.send(product.success, result)
        })
        app.get('/cartProduct', async (req, res) => {
            const query = {};
            const cursor =  AddToCartCollection.find(query);
            const books = await cursor.toArray();
            res.send(books)
        })

        app.get('/categories', async (req, res) => {
            const category = req.query.category;
            const result = await bookCollections.find({ category: category }).toArray();
            res.send(result)
        });


    } finally {
        
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send(' our site is running properly')
})

app.listen(port, () => {
    console.log('listening to port', port)
})