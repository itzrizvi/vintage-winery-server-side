// REQUEIRING COMMANDS 
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

// Creating APP and PORT
const app = express();
const port = process.env.PORT || 5000;

// MIDDLE WARE
app.use(cors());
app.use(express.json());

// DB CREDENTIALS
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w9ewo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// ASYNC FUNCTION FOR API's
async function run() {
    try {
        await client.connect();
        const database = client.db("vintage_winery");
        const winesCollection = database.collection("wines");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection("users");
        console.log('DB CONNECTED');

        // GET API FOR ALL WINES
        app.get('/wines', async (req, res) => {
            const cursor = winesCollection.find({});
            const allWines = await cursor.toArray();
            res.send(allWines)
        });

        // GET API for single wine details
        app.get('/wines/:wineId', async (req, res) => {
            const WINEID = req.params.wineId;
            const query = { _id: ObjectId(WINEID) };
            const wine = await winesCollection.findOne(query);
            res.json(wine)
        });

        // POST API for orders
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result)
        });

        // POST and PUT API FOR SAVING USER DATA
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello From Vintage Winery!')
})

app.listen(port, () => {
    console.log(`Listening to PORT : ${port}`)
})