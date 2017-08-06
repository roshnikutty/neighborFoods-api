const { BasicStrategy } = require('passport-http');
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const cfg = require('../config');
var jwt = require("jwt-simple");
const { User } = require('./models');
const router = express.Router();
router.use(jsonParser);

router.post("/token", function (req, res) {
  console.log(req.body);
  if (req.body.username && req.body.password) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username, password);
    User.findOne({ username: username })
      .then((user) => {
        user.validatePassword(password)
          .then(() => {
            res.json({token: jwt.encode({id: user.id}, cfg.JWT.jwtSecret)});
          }).catch(err => console.log(err))
      }
      )
  }
  else {
    res.sendStatus(401);
  }
});

router.post("/", function (req, res) {
  console.log(req.body);
  User.hashPassword(req.body.password)
    .then((hashedPassword) => {
      User
        .create(
        {
          username: req.body.username,
          password: hashedPassword,
          firstName: req.body.firstName,
          lastName: req.body.lastName
        }
        )
        .then(user => res.status(201).json(user.apiRepr()))
        .catch(err => {
          console.log(err);
          res.status(500).json({ message: "Internal server error" });
        });
    })

});

module.exports = router;
