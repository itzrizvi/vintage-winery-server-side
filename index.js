// REQUEIRING COMMANDS 
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

// Creating APP and PORT
const app = express();
const port = process.env.PORT || 5000;

// VERIFY TOKEN SDK
admin.initializeApp({
    credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,

    })
});

// MIDDLE WARE
app.use(cors());
app.use(express.json());

// DB CREDENTIALS
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w9ewo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// VERIFY TOKEN FUNCTION
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}

// ASYNC FUNCTION FOR API's
async function run() {
    try {
        await client.connect();
        const database = client.db("vintage_winery");
        const winesCollection = database.collection("wines");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection("users");
        const ratingsCollection = database.collection("ratings");
        // Confirm DB CONNECT TO SERVER
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
        app.get('/orders', verifyToken, async (req, res) => {
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'Admin') {
                    const cursor = ordersCollection.find({});
                    const allOrder = await cursor.toArray();
                    res.send(allOrder);
                }
            }
        });

        // GET API for Individual User orders JSON array value server
        app.get('/orders/:email', verifyToken, async (req, res) => {
            let query = {};
            const email = req.params.email;
            if (email) {
                query = { clientEmail: email }
            }
            const cursor = ordersCollection.find(query);
            const allOrder = await cursor.toArray();
            res.send(allOrder);
        });

        // PUT API for make admin role
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'Admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'Admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'You Do Not Have Access' })
            }
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
        app.put('/orders/:id', verifyToken, async (req, res) => {
            const ID = req.params.id;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'Admin') {
                    const filter = { _id: ObjectId(ID) };
                    const options = { upsert: true };
                    const updateDoc = { $set: { orderStatus: 'Shipped' } };
                    const result = await ordersCollection.updateOne(filter, updateDoc, options);
                    res.json(result);
                }
            }
        });

        // DELETE API for Order Delete by Admins and User
        app.delete('/orders/:id', async (req, res) => {
            const ID = req.params.id;
            const query = { _id: ObjectId(ID) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);

        });

        // POST API for add new wine by Admin
        app.post('/wines', verifyToken, async (req, res) => {
            const newWine = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'Admin') {
                    const result = await winesCollection.insertOne(newWine);
                    res.json(result);
                }
            }
        });

        // DELETE API for delete wine by Admin
        app.delete('/wines/:id', verifyToken, async (req, res) => {
            const ID = req.params.id;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'Admin') {
                    const query = { _id: ObjectId(ID) };
                    const result = await winesCollection.deleteOne(query);
                    res.json(result);
                }
            }
        });

        // POST API for Ratings by all
        app.post('/ratings', async (req, res) => {
            const newRating = req.body;
            const result = await ratingsCollection.insertOne(newRating);
            res.json(result);
        });

        // GET API for all Ratings JSON array value to server
        app.get('/ratings', async (req, res) => {
            const cursor = ratingsCollection.find({});
            const allRatings = await cursor.toArray();
            res.send(allRatings);
        });

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

// Server Opening
app.get('/', (req, res) => {
    res.send('Hello From Vintage Winery!')
})

// Listening PORT
app.listen(port, () => {
    console.log(`Listening to PORT : ${port}`)
})