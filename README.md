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
  indexName: 'yourSchema', //The name of the index in Algolia, you can also pass in a function
  selector: '-author', //You can decide which field that are getting synced to Algolia (same as selector in mongoose)
  populate: {
    path: 'comments',
    select: 'author'
  },
  defaults: {
    author: 'unknown'
  },
  mappings: {
    title: function(value) {
      return `Book: ${value}`
    }
  }
  debug: true // Default: false -> If true operations are logged out in your console
});


let Model = mongoose.model('YourSchema', YourSchema);

Model.SyncToAlgolia(); //Clears the Algolia index for this schema and synchronizes all documents to Algolia (based on the settings defined in your plugin settings)
Model.SetAlgoliaSettings({
  searchableAttributes: ['name','properties','shows'] //Sets the settings for this schema, see [Algolia's Index settings parameters](https://www.algolia.com/doc/api-client/javascript/settings#set-settings) for more info.
});
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

**Powerful hint:** Your indexname function can return an array aswell! Let me give you an example: One user belongs to multiple companies, and each company has its own user index -> return an array of all indices the document belongs to, to sync it to every index (company users).   

#### selector
You can decide which field should be excluded or included by setting the `selector` property (same as in mongoose) *Must be a string*

#### populate
You can populate fields before sending them to `Algolia` by setting the populate property. (same as in mongoose, see [docs about population](http://mongoosejs.com/docs/api.html#document_Document-populate))

#### defaults
You can set default values for fields that are blank in mongoose.
This is very useful in cases where you have documents with optional fields. Since it isn't possible to query `null` values in algolia, setting those fields to 'unknown' or 'notset' makes them searchable/filterable.

*You can nest properties*

#### mappings
If you want to modify your fields before sending it to algolia you can create mapping functions.

Let me show you an example:

Dataset:
```js
  {
    name: {
      firstname: 'Peter',
      lastname: 'Griffin'
    }
  }
```

Now we dont want to store each field individually but as one string instead. We do it the following way:
```js
mappings: {
  name: function(value) {
    //Value is the 'name' object
    return `${value.firstname} ${value.lastname}`; //ES6 is awesome :)
  }
}
```

*You can nest properties*

#### softdelete
You can enable softdeletion support (like [mongoose-delete](https://github.com/dsanel/mongoose-delete)) by setting `softdelete` to true.

As a result, all documents updated with a property `deleted: true` will be removed from Algolia.


#### debug
You can enable logging of all operations by setting `debug` to true

### Methods

#### SyncToAlgolia

Call this method if you want to sync all your documents with algolia

This method clears the Algolia index for this schema and synchronizes all documents to Algolia (based on the settings defined in your plugin settings)

```js
Model.SyncToAlgolia();
```

#### SetAlgoliaSettings

Sets the settings for this schema, see [Algolia's Index settings parameters](https://www.algolia.com/doc/api-client/javascript/settings#set-settings) for more info about available parameters.

```js
Model.SetAlgoliaSettings({
  searchableAttributes: ['name','properties','shows']
});
```

## License

[The MIT License](http://opensource.org/licenses/MIT)
Copyright (c) Carsten Jacobsen
