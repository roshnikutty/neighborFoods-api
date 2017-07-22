const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
// const passport = require('passport');
// import cfg from './config';
const { Seller } = require('./models');
const { Buyer } = require('./models');

mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');

app.use(express.static('public'));
app.use(bodyParser.json());

//logging and passport
app.use(morgan('common'));

//Return a list of all existing seller postings
app.get('/meals', (req, res) => {
    Seller
        .find()
        .exec()
        .then(sellers => {
            res.json({
                meals: sellers.map((seller) => seller.apiRepr())
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" })
        });
});

//Create a new seller with meal entry
app.post('/meals', (req, res) => {
    const requiredField = ['seller_name', 'sell_dish', 'sell_plate_count', 'sell_plate_cost', 'sell_allergens', 'sell_email_address'];
    for (var i=0; i<requiredField.length; i++){
        if (!(requiredField[i] in req.body)) {
            const message = `Missing \`${requiredField[i]}\` name in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Seller
        .create(
        {
            seller_name: req.body.seller_name,
            sell_dish: req.body.sell_dish,
            sell_cuisine: req.body.sell_cuisine,
            sell_date: req.body.sell_date,
            sell_plate_count: req.body.sell_plate_count,
            sell_plate_cost: req.body.sell_plate_cost,
            sell_allergens: req.body.sell_allergens,
            sell_email_address: req.body.sell_email_address
        }
        )
        .then(seller => res.status(201).json(seller.apiRepr()))
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
});

//Update a seller's meal entry
app.put('/meals/:id', (req, res) => {
    Seller
        .findByIdAndUpdate(req.params.id, { $set: req.body })
        .exec()
        .then(seller => res.status(204).end())
        .catch(err => res.status(400).json({ message: 'Internal server error' }));
});

//Delete a seller's meal entry
app.delete('/meals/:id', (req, res) => {
    Seller
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(blog => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});


//Get all buyers
// app.get('/buyers', (req, res) => {
//     Buyer
//         .find()
//         .exec()
//         .then(buyers => {
//             res.json({
//                 buyers: buyers.map((buyer) => buyer.apiRepr())
//             });
//         }).catch(err => {
//             console.log(err);
//             res.status(500).json({ message: "Internal server error" })
//         });
// });

//Get a buyer by Id
app.get('/buyers/:id', (req, res) => {
    Buyer
        .findById(req.params.id)
        .exec()
        .then(buyer => res.json(buyer.apiRepr())
        ).catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
});

//Create a new buyer
app.post('/buyers', (req, res) => {
    const requiredField = ['buyer_name', 'buy_plate_count', 'buy_email_address'];
    for (var i=0; i<requiredField.length; i++){
        if (!(requiredField[i] in req.body)) {
            const message = `Missing \`${requiredField[i]}\` name in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Buyer
        .create(
        {
            buyer_name: req.body.buyer_name,
            buy_date: req.body.buy_date,
            buy_plate_count: req.body.buy_plate_count,
            buy_email_address: req.body.buy_email_address
        }
        )
        .then(buyer => res.status(201).json(buyer.apiRepr()))
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
});

//Update a buyer's info or requirement
app.put('/buyers/:id', (req, res) => {
    Buyer
        .findByIdAndUpdate(req.params.id, { $set: req.body })
        .exec()
        .then(seller => res.status(204).end())
        .catch(err => res.status(400).json({ message: 'Internal server error' }));
});

//Delete a buyer's meal request
app.delete('/buyers/:id', (req, res) => {
    Buyer
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(blog => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//To deal with any other path, return a 404-error
app.use('*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});


let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`App is listening at port ${port}`);
                resolve();
            })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log(`Closing server`);
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
};


module.exports = { app, runServer, closeServer };
