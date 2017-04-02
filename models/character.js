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
  age: {
    type: Number
  },
  counter: {
    type: Number,
    default: 1
  },
  parents: {
    mother: {
      type: String
    },
    father: {
      type: String
    }
  }
});

characterSchema.plugin(algolia,{
  indexName: function(doc) {
    return (doc.properties && doc.properties.length) ? doc.properties.map(prop => `${prop}-character`) : `default-character` ; 
  },
  appId: process.env.ALGOLIA_APP_ID,
  apiKey: process.env.ALGOLIA_API_KEY,
  selector: '-updatedAt -createdAt -parents.father -counter',
  populate: {
    path: 'shows',
    select: 'name genre -_id'
  },
  defaults: {
    age: 'unknown',
    properties: 'notset',
    parents: {
      mother: 'notset'
    }
  },
  mappings: {
    name: function(value) {
      return `${value.firstname} ${value.lastname}`
    },
    parents: {
      mother: function(value) {
        return value.substring(0,1) + ' ' + value.split(' ').pop();
      }
    }
  },
  debug: true
});

let Character = mongoose.model('Character',characterSchema);

Character.SetAlgoliaSettings({
  searchableAttributes: ['name','properties','shows', 'age']
});

module.exports = Character
