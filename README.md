# mongoose-algolia
[![Build Status](https://travis-ci.org/crsten/mongoose-algolia.svg?branch=master&style=flat-square)](https://travis-ci.org/crsten/mongoose-algolia)
[![npm](https://img.shields.io/npm/dt/mongoose-algolia.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-algolia)
[![npm](https://img.shields.io/npm/v/mongoose-algolia.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-algolia)

[Mongoose](http://mongoosejs.com/) plugin to automatically sync documents to [Algolia](https://www.algolia.com/)

This module lets you sync your document from mongoose to algolia on the fly. By plugging into Mongoose, Algolia will automatically get all your new/changed/removed documents synchronized. 

### Installation
`npm install --save mongoose-algolia`

### Usage

```js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAlgolia = require('mongoose-algolia');

let YourSchema = new Schema({
  title: String,
  description: String,
  author: String
});

YourSchema.plugin(mongooseAlgolia,{
  appId: YOUR_ALGOLIA_APP_ID,
  apiKey: YOUR_ALGOLIA_API_KEY,
  indexName: 'yourSchema', //The name of the index in algolia
  selector: '-author', //You can decide which field that are getting synced to algolia (same as selector in mongoose)
  debug: true // Default: false -> If true operations are logged out in your console
});

mongoose.model('YourSchema', YourSchema);
```

### Important notes

This plugin synchronizes your documents to algolia at save/update/remove. It wont sync data that has been created before attaching this plugin.

## License

[The MIT License](http://opensource.org/licenses/MIT)
Copyright (c) Carsten Jacobsen
