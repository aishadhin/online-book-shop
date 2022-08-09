const express = require('express');
const cors = require('cors');
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
        const AddToCartCollection = client.db("AddToCart").collection("cartProduct")

        app.get('/product', async (req, res) => {
            if (req.query.name) {
                const name = req.query.name;
                const matched = await bookCollections.find({ "name": { "$regex": name, "$options": "i" } }).toArray();
                res.send(matched);
            } else {
                res.send(bookCollections)
            }
        })

        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = bookCollections.find(query);
            const books = await cursor.toArray();
            res.send(books)
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singleBook = await bookCollections.findOne(query);
            res.send(singleBook);
        });

        app.post('/cartProduct', async (req, res) => {
            const product = req.body;
            console.log(product);
            const query = { products: product.bookName }
            console.log(query);
            const exists = await AddToCartCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, product: exists })
            }
            const result = await AddToCartCollection.insertOne(product)
            res.send(product.success, result)
        })

        app.get('/cartProduct', async (req, res) => {
            const query = {};
            const cursor = AddToCartCollection.find(query);
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
    res.send('this server side done')
})

app.listen(port, () => {
    console.log('listening to port', port)
})