const express = require('express');
const mongo = require('mongodb').MongoClient;
const cors = require('cors');

const app = express();
let db = null;

app.get('/mongo/getMap/:mapName', cors(), (req, res) => {
	db.collection('maps').find({mapName: req.params.mapName}).toArray(function(err, docs){
        if (err) {
            res.status(404).send("Unable to retrieve "+ req.params.mapName +" map config from db");
        } else {
            res.send(docs);
        }
	});
});

app.get('/mongo/getMaps', cors(), (req, res) => {
    db.collection('maps').find().toArray(function(err, docs){
        if (err) {
            res.status(404).send("Unable to retrieve "+ req.params.mapName +" map config from db");
        } else {
            res.send(docs);
        }
    });
});

app.get('/mongo/getAreas/:mapName', cors(), (req, res) => {
    db.collection('areas').find({mapName: req.params.mapName}).toArray(function(err, docs){
        if (err || docs.length == 0) {
            res.status(404).send("No areas from "+ req.params.mapName +" map from db");
        } else {
            res.send(docs);
        }
    });
});

app.get('/mongo/getPoints/:mapName', cors(), (req, res) => {
    db.collection('points').find({mapName: req.params.mapName}).toArray(function(err, docs){
        if (err || docs.length == 0) {
            res.status(404).send("No points from "+ req.params.mapName +" map from db");
        } else {
            res.send(docs);
        }
    });
});

app.get('/mongo/getPaths/:mapName', cors(), (req, res) => {
    db.collection('paths').find({mapName: req.params.mapName}).toArray(function(err, docs){
        if (err || docs.length == 0) {
            res.status(404).send("No paths from "+ req.params.mapName +" map from db");
        } else {
            res.send(docs);
        }
    });
});

app.get('/mongo/getPotions/', cors(), (req, res) => {
    db.collection('potions').find().toArray(function(err, docs){
        if (err || docs.length == 0) {
            res.status(404).send("No potions from found in db");
        } else {
            res.send(docs);
        }
    });
});

app.get('/mongo/getPlants/', cors(), (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    db.collection('plants').find({}).toArray(function(err, docs){
        if (err || docs.length == 0) {
            res.status(404).send("No plants in plants db");
        } else {
            res.send(docs);
        }
    });
});

app.put('/mongo/harvestPlant/:plantName/:harvestedAmount', cors(), (req, res) => {
    db.collection('plants').updateOne(
        {name: req.params.plantName},
        {
            $set: {"timeToHarvest": 0},
            $inc: {"inv_quantity": parseInt(req.params.harvestedAmount)}
        }, function (err, docs) {
            if (err) {
                res.status(400).send("Unable to update " + req.params.plantName + " in database" + err);
            } else {
                res.send(docs);
            }
        }
    );
});

app.put('/mongo/addPlant/:plantName', cors(), (req, res) => {
    db.collection('plants').updateOne(
        {name: req.params.plantName},
        {
            $inc: {quantity: 1}
        }, function (err, docs) {
            if (err) {
                res.status(400).send("Unable to increment quantity for " + req.params.plantName + " in database");
            } else {
                res.send(docs);
            }
        }
    );
});

app.put('/mongo/addPoint/:mapName/:pointName/:lat/:lng', cors(), (req, res) => {
    db.collection('points').insertOne(
        {}
        , function (err, docs) {
            if (err) {
                res.status(400).send("Unable to add point to the db");
            } else {
                res.send(docs);
            }
        }
    );
});

app.put('/mongo/addDay/', cors(), (req, res) => {
    db.collection('plants').updateMany(
        {quantity: {$gt : 0}},
        {$inc:
            {timeToHarvest: 1}
        }, function (err, docs) {
            if (err) {
                res.status(400).send("Unable to add day to plants in database");
            } else {
                res.send(docs);
            }
        }
    );
});

mongo.connect('mongodb+srv://mongo:pass@cluster0-qmjg5.mongodb.net/dnd_nodes?retryWrites=true&w=majority', {useNewUrlParser: true}, (err, client) => {
    if (err) {
        throw err;
    } else {
        db = client.db('dnd_nodes');
        db.collection('maps').find({}).toArray(function(err, docs){
            if (err || docs.length == 0) {
                console.log("No maps in maps db");
            } else {
                console.log(docs);
            }
        });
    }
});

app.listen(3001, () => console.log(`DND Mongo DB listening on port 3001!`));
