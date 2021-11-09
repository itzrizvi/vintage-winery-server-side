// REQUEIRING COMMANDS 
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
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
        console.log('DB CONNECTED');
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello From Vintage Winery!')
})

app.listen(port, () => {
    console.log(`Listening to PORT : ${port}`)
})