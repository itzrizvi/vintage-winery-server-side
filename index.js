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

        // GET API for all orders JSON array value server
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const allOrder = await cursor.toArray();
            res.send(allOrder);
        });

        // GET API for Individual User orders JSON array value server
        app.get('/orders/:email', async (req, res) => {
            let query = {};
            const email = req.params.email;
            console.log(req.query.email)
            if (email) {
                query = { clientEmail: email }
            }
            const cursor = ordersCollection.find(query);
            const allOrder = await cursor.toArray();
            res.send(allOrder);
        });

        // PUT API for make admin role
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'Admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // GET API for check admin or not
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'Admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // PUT API for order status change by Admin
        app.put('/orders/:id', async (req, res) => {
            const ID = req.params.id;
            const filter = { _id: ObjectId(ID) };
            const options = { upsert: true };
            const updateDoc = { $set: { orderStatus: 'Shipped' } };
            const result = await ordersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // DELETE API for Order Delete by Admins and User
        app.delete('/orders/:id', async (req, res) => {
            const ID = req.params.id;
            const query = { _id: ObjectId(ID) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })

        // POST API for add new wine by Admin
        app.post('/wines', async (req, res) => {
            const newWine = req.body;
            const result = await winesCollection.insertOne(newWine);
            res.json(result);
        });

        // DELETE API for delete wine by Admin
        app.delete('/wines/:id', async (req, res) => {
            const ID = req.params.id;
            const query = { _id: ObjectId(ID) };
            const result = await winesCollection.deleteOne(query);
            res.json(result);
        })

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