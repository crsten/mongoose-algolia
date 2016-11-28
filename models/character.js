'use strict';

const mongoose = require('mongoose');
const algolia = require('./../src/index');
const Schema = mongoose.Schema;

const characterSchema = new Schema({
  name: {
    firstname: String,
    lastname: String
  },
  properties: [String],
  shows: [{
    type: Schema.Types.ObjectId,
    ref: 'Show'
  }],
  counter: {
    type: Number,
    default: 1
  }
});

characterSchema.plugin(algolia,{
  indexName: function(doc) {return `${doc.name.lastname}-character`},
  appId: process.env.ALGOLIA_APP_ID,
  apiKey: process.env.ALGOLIA_API_KEY,
  selector: '-updatedAt -createdAt',
  populate: {
    path: 'shows',
    select: 'name genre -_id'
  },
  debug: true
});

let Character = mongoose.model('Character',characterSchema);

Character.SetAlgoliaSettings({
  searchableAttributes: ['name','properties','shows']
});

module.exports = Character
