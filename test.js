'use strict';

require('dotenv').config();

const data = require('./sample-data.json');

const mongoose = require('mongoose');
const algolia = require('./src/index');
const Schema = mongoose.Schema;

/* DB setup */
mongoose.connect('mongodb://localhost:27017/mongoose-algolia', (err) => {
  (err) ? console.error(`${err.name}: ${err.message}`) : console.log('Database connected - √');
});
/* Mongoose setup */
mongoose.Promise = global.Promise;
