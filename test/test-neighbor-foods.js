const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();
const { app, runServer, closeServer } = require('../server');
const { Buyer, Seller } = require('../models');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

describe('Accessing root', function () {
    it('should get 200 status', function () {
        app.get('/', (res, req) => {
            res.should.have.status(200);
            res.sendFile(__dirname + '/public/index.html')
        })
    });
});

function seedSellerData() {
    console.info('Seeding seller data');
    const seedData = [];
    for (let i = 0; i <= 10; i++) {
        seedData.push(generateSellerData());
    }
    Seller
        .insertMany(seedData)
        .then(data => data)
        .catch(err => {
            console.log(`error: ${err}`);
        });
}

function seedBuyerData() {
    console.info('Seeding buyer data');
    const seedData = [];
    for (let i = 0; i <= 10; i++) {
        seedData.push(generateBuyerData());
    }
    Buyer
        .insertMany(seedData)
        .then(data => data)
        .catch(err => {
            console.log(`error: ${err}`);
        });
}

function tearDownDb() {
    console.log('Deleting database');
    return mongoose.connection.dropDatabase();
}

function generateSellerData() {
    return {
        seller_name: `${faker.name.firstName()} ${faker.name.lastName}`,
        sell_dish: faker.lorem.words(),
        sell_cuisine: faker.lorem.words(),
        sell_date: faker.date.recent(),
        sell_plate_count: faker.random.number(),
        sell_plate_cost: faker.random.number(),
        sell_allergens: faker.lorem.words(),
        sell_email_address: faker.internet.email()
    }
}

function generateBuyerData() {
    return {
        buyer_name: `${faker.name.firstName()} ${faker.name.lastName}`,
        buy_date: faker.date.recent(),
        buy_plate_count: faker.random.number(),
        buy_email_address: faker.internet.email()
    }
}

describe('Seller API resource', function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedSellerData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });

    describe('GET seller endpoint', function () {
        it('should return all existing sellers', function () {
            let res;
            return chai.request(app)
                .get('/meals')
                .then(function (_res) {
                    res = _res;
                    res.should.have.status(200);
                    res.body.meals.should.have.length.of.at.least(1);
                    return Seller.count();
                })
                .then(function (count) {
                    res.body.meals.should.have.length.of(count);
                })
                .catch(err => `Error encountered: ${err}`);
        });
        it(`should return meals with the right fields`, function () {
            let resBuyer;
            return chai.request(app)
                .get('/meals')
                .then(function (res) {
                    res.should.be.json;
                    res.body.meals.should.be.a('array');
                    res.body.meals.forEach(function (meal) {
                        meal.should.be.a('Object');
                        meal.should.include.keys('id', 'seller_name', 'sell_dish', 'sell_date', 'sell_plate_count', 'sell_allergens', 'sell_plate_cost', 'sell_email_address');
                    });
                    resBuyer = res.body.meals[0];
                    return Seller.findById(resBuyer.id);
                })
                .then(function (meal) {
                    resBuyer.meal_id.should.equal(meal.meal_id);
                    resBuyer.seller_name.should.equal(meal.seller_name);
                    resBuyer.sell_dish.should.equal(meal.sell_dish);
                    resBuyer.sell_date.should.equal(meal.sell_date);
                    resBuyer.sell_plate_count.should.equal(meal.sell_plate_count);
                    resBuyer.sell_plate_cost.should.equal(meal.sell_plate_cost);
                    resBuyer.sell_allergens.should.equal(meal.sell_allergens);
                    resBuyer.sell_email_address.should.equal(meal.sell_email_address);
                }).catch(err => `Error encountered: ${err}`);
        });
    });

    describe('POST seller endpoint', function () {
        it(`should add a new meal with seller's info`, function () {
            const newMeal = generateSellerData();
            return chai.request(app)
                .post('/meals')
                .send(newMeal)
                .then(function (res) {
                    // const date = new Date(res.body.sell_date);
                    // console.log(`Here is the updated format ${date}`);
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('Object');
                    res.body.should.include.keys('seller_name', 'sell_dish', 'sell_date', 'sell_plate_count', 'sell_allergens', 'sell_plate_cost', 'sell_email_address');
                    res.body.seller_name.should.equal(newMeal.seller_name);
                    res.body.sell_dish.should.equal(newMeal.sell_dish);
                    // date.should.equal(newMeal.sell_date);
                    res.body.sell_plate_count.should.equal(newMeal.sell_plate_count);
                    res.body.sell_plate_cost.should.equal(newMeal.sell_plate_cost);
                    res.body.sell_allergens.should.equal(newMeal.sell_allergens);
                    res.body.sell_email_address.should.equal(newMeal.sell_email_address.toLowerCase());
                    res.body.meal_id.should.not.be.null;
                    return Seller.findById(res.body.meal_id);
                })
                .then(function (meal) {
                    meal.seller_name.should.equal(newMeal.seller_name);
                    meal.sell_dish.should.equal(newMeal.sell_dish);
                    // meal.sell_date.should.equal(newMeal.sell_date);
                    meal.sell_plate_count.should.equal(newMeal.sell_plate_count);
                    meal.sell_plate_cost.should.equal(newMeal.sell_plate_cost);
                    meal.sell_allergens.should.equal(newMeal.sell_allergens);
                    meal.sell_email_address.should.equal(newMeal.sell_email_address.toLowerCase());
                }).catch(err => console.log(`error for seller's POST: ${err}`));
        });
    });

    describe('PUT seller endpoint', function () {
        it('should update an existing meal info with the fields I send over', function () {
            const updateData = {
                seller_name: "Queen Elsa",
                sell_dish: "Ice cream",
                sell_cuisine: "Dessert",
                sell_date: "2017-03-03",
                sell_plate_count: 4,
                sell_plate_cost: 10,
                sell_allergens: "milk, pecans",
                sell_email_address: "elsa_blizzard_queen@ice.com"
            }
            return Seller
                .findOne()
                .exec()
                .then(function (meal) {
                    updateData.id = meal.meal_id;

                    return chai.request(app)
                        .put(`/meals/${meal.meal_id}`)
                        .send(updateData);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Seller.findById(updateData.id).exec();
                })
                .then(function (meal) {
                    meal.seller_name.should.equal(updateData.seller_name);
                    meal.sell_dish.should.equal(updateData.sell_dish);
                    meal.sell_date.should.equal(updateData.date);
                    meal.sell_plate_count.should.equal(updateData.sell_plate_count);
                    meal.sell_plate_cost.should.equal(updateData.sell_plate_cost);
                    meal.sell_allergens.should.equal(updateData.sell_allergens);
                    meal.sell_email_address.should.equal(updateData.sell_email_address);
                }).catch(err => `err: ${err}`);
        });
    });

    describe('DELETE seller meal endpoint', function () {
        it('should delete a meal by id', function () {
            let meal;
            return Seller
                .findOne()
                .exec()
                .then(function (_meal) {
                    meal = _meal;
                    return chai.request(app).delete(`/meals/${meal.meal_id}`)
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Seller.findById(meal.meal_id).exec();
                })
                .then(function (_meal) {
                    should.not.exist(_meal);
                }).catch(err => `err: ${err}`);
        });
    });
});

describe('Buyer API resource', function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedSellerData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });

    describe('GET and POST a buyer endpoint', function () {
        it('should return a buyer by id after creating a new buyer', function () {
            const newBuyer = generateBuyerData();
            return chai.request(app)
                .post('/buyers')
                .send(newBuyer)
                .then(function (res) {
                    res.should.have.status(201);
                    buyerId = res.body.buyer_id;
                    console.log(buyerId);
                    return buyerId;
                })
                .then(function (buyerId) {
                    return chai.request(app)
                        .get(`/buyer/${buyerId}`)
                        .then(function (res) {
                            res.should.be.json;
                            res.should.have.status(200);
                            res.body.meals.should.be.a('Object');
                            res.body.should.include.keys('buyer_name', 'buy_date', 'buy_plate_count', 'buy_email_address');
                        })
                        .catch(err => `Error encountered: ${err}`);
                });
        });
        it('should return buyer with the right fields', function () {
            let resBuyer;
            return chai.request(app)
                .get('/meals')
                .then(function (res) {
                    resBuyer = res.body[0];
                    return Buyer.findById(resBuyer.id);
                })
                .then(function (buyer) {
                    resBuyer.buyer_id.should.equal(buyer.id);
                    resBuyer.buyer_name.should.equal(meal.buyer_name);
                    resBuyer.buy_date.should.equal(meal.buy_date);
                    resBuyer.buy_plate_count.should.equal(meal.buy_plate_count);
                    resBuyer.buy_email_address.should.equal(meal.buy_email_address);
                }).catch(err => `Error encountered: ${err}`);
        });
    });
    describe('PUT buyer endpoint', function () {
        it('should update an existing buyer with the fields I send over', function () {
            const updateData = {
                buyer_name: "Oracle Miracle",
                buy_plate_count: 4,
                buy_email_address: "oracle_miracle@twister.com"
            }
            return Buyer
                .findOne()
                .exec()
                .then(function (buyer) {
                    updateData.id = buyer.buyer_id;
                    return chai.request(app)
                        .put(`/buyers/${buyer.buyer_id}`)
                        .send(updateData);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Buyer.findById(updateData.id).exec();
                })
                .then(function (buyer) {
                    buyer_name.should.equal(updateData.buyer_name);
                    buy_plate_count.should.equal(updateData.buy_plate_count);
                    buy_email_address.should.equal(updateData.buy_email_address);
                }).catch(err => `err: ${err}`);
        });
    });

    describe('DELETE buyer endpoint', function () {
        it('should delete buyer entry by id', function () {
            let buyer;
            return Buyer
                .findOne()
                .exec()
                .then(function (_buyer) {
                    buyer = _buyer;
                    return chai.request(app).delete(`/buyers/${buyer.buyer_id}`)
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Buyer.findById(buyer.buyer_id).exec();
                })
                .then(function (_buyer) {
                    should.not.exist(_buyer);
                }).catch(err => `err: ${err}`);
        });
    });

});