require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const cfg = require('./config');
const { Seller } = require('./models');
const { Buyer } = require('./models');
const { User } = require('./users/models');
const cors = require('cors');
app.use(cors());

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
opts.secretOrKey = cfg.JWT.jwtSecret;

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    // console.log(jwt_payload);

    User.findOne({ id: jwt_payload.sub }, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
            // or you could create a new account 
        }
    });
}, (e) => console.log(e)));

const { usersRouter } = require('./users');


mongoose.Promise = global.Promise;

const PORT = process.env.PORT || 8080;
const DATABASE_URL  = process.env.MONGODB_URI || `mongodb://localhost:27017`;
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.header("Allow-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    next();
});

//logging and passport
app.use(morgan('common'));
app.use('/users', usersRouter);

//Return a list of all existing seller postings
app.get('/meals', passport.authenticate("jwt", { session: false }), (req, res) => {
    Seller
        .find() // add condition where status != 'soldout'
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
app.post('/meals', passport.authenticate("jwt", { session: false }), (req, res) => {
    const requiredField = ['seller_name', 'sell_dish', 'sell_plate_count', 'sell_plate_cost', 'sell_allergens', 'sell_email_address'];
    for (var i = 0; i < requiredField.length; i++) {
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
app.put('/meals/:id', passport.authenticate("jwt", { session: false }), (req, res) => {
    Seller
        .findByIdAndUpdate(req.params.id, { $set: req.body })
        .exec()
        .then(seller => res.status(204).end())
        .catch(err => res.status(400).json({ message: 'Internal server error' }));
});

//Delete a seller's meal entry
app.delete('/meals/:id', passport.authenticate("jwt", { session: false }), (req, res) => {
    Seller
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(blog => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//Seller's plate count should get updated after buyer buys some meals
app.post('/meals/:meal_id/:buy_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log(req.body.buy_plate_count);
    Seller
        .findById(req.params.meal_id)
        .exec()
        .then(seller => {
            let newPlate_count = seller.sell_plate_count - req.body.buy_plate_count;
            console.log(newPlate_count)
            if (newPlate_count < 0) {
                res.status(400).json({message: 'sold out'}) // then show message in client that there aren't that many plates
            } else {
                if (newPlate_count === 0) {
                    seller.status = 'Soldout'
                    console.log(seller.status);
                }
                seller.sell_plate_count = newPlate_count
                seller.save()
                res.json(seller)
            }
        }).catch(err => console.log(`Error updating seller's plate count: ${err}`))
})


//Get all buyers
app.get('/buyers', (req, res) => {
    Buyer
        .find()
        .exec()
        .then(buyers => {
            res.json({
                buyers: buyers.map((buyer) => buyer.apiRepr())
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" })
        });
});

//Get a buyer by Id
app.get('/buyers/:id', passport.authenticate("jwt", { session: false }), (req, res) => {
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
app.post('/buyers', passport.authenticate("jwt", { session: false }), (req, res) => {
    const requiredField = ['buyer_name', 'buy_plate_count', 'buy_email_address'];
    for (var i = 0; i < requiredField.length; i++) {
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
app.put('/buyers/:id', passport.authenticate("jwt", { session: false }), (req, res) => {
    Buyer
        .findByIdAndUpdate(req.params.id, { $set: req.body })
        .exec()
        .then(seller => res.status(204).end())
        .catch(err => res.status(400).json({ message: 'Internal server error' }));
});

//Delete a buyer's meal request
app.delete('/buyers/:id', passport.authenticate("jwt", { session: false }), (req, res) => {
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
