# mongoose-algolia
[![Build Status](https://travis-ci.org/crsten/mongoose-algolia.svg?branch=master&style=flat-square)](https://travis-ci.org/crsten/mongoose-algolia)
[![npm](https://img.shields.io/npm/dt/mongoose-algolia.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-algolia)
[![npm](https://img.shields.io/npm/v/mongoose-algolia.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-algolia)

[Mongoose](http://mongoosejs.com/) plugin to automatically sync documents to [Algolia](https://www.algolia.com/)

This module syncs your documents from mongoose to Algolia for you. By plugging into Mongoose, Algolia will automatically synchronize your new/changed/removed documents.

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
  indexName: 'yourSchema', //The name of the index in algolia, you can also pass in a function
  selector: '-author', //You can decide which field that are getting synced to algolia (same as selector in mongoose)
  populate: {
    path: 'comments',
    select: 'author'
  },
  debug: true // Default: false -> If true operations are logged out in your console
});

mongoose.model('YourSchema', YourSchema);
```

### Options

#### appId / apiKey
You can find this in your `Algolia` instance

#### indexName

This will be the name of the index in `Algolia`.

There are 2 ways of setting the `indexName` property

1. as a string

```js
YourSchema.plugin(mongooseAlgolia,{
  //other props...
  indexName: 'yourSchema',
  //other props...
});
```

2. as a function (dynamically)

```js
YourSchema.plugin(mongooseAlgolia,{
  //other props...
  indexName: function(doc) {
    return `yourSchema_${somethingelse}`
  },
  //other props...
});
```

This allows you to have multiple indexes splittet by some properties.
Very handy in situations where you want to have a seperate index for each company or similar...

#### selector
You can decide which field should be excluded or included by setting the `selector` property (same as in mongoose) *Must be a string*

#### populate
You can populate fields before sending them to `Algolia` by setting the populate property. (same as in mongoose, see [docs about population](http://mongoosejs.com/docs/api.html#document_Document-populate))

#### debug
You can enable logging of all operations by setting `debug` to true

### Important notes

This plugin synchronizes your documents to algolia at save/update/remove. It wont sync data that has been created before attaching this plugin.

## License

[The MIT License](http://opensource.org/licenses/MIT)
Copyright (c) Carsten Jacobsen
