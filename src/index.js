'use strict';

const algolia = require('algoliasearch');
const clc = require('cli-color');

module.exports = exports = function algoliaIntegration(schema,options) {
  if(!options || !options.indexName) console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> options.indexName is required');
  if(!options || !options.appId) console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> options.appId is required');
  if(!options || !options.apiKey) console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> options.apiKey is required');

  const client = algolia(options.appId,options.apiKey);
  const index = client.initIndex(options.indexName);

  schema.pre('save',function(next) {
    this.wasNew = this.isNew;
    this.wasModified = this.isModified();
    next();
  });

  schema.post('save',function() {
    if(this.wasNew) {
      index.addObject(this.toObject({
        transform: function(doc,ret) {
          delete ret._id;
          if(options && options.selector) ret = applySelector(ret);
          return ret;
        }
      }),this._id,(err,content) => {
        if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
        if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Created'),' -> ObjectId: ',content.objectID);
      });
    }else if(this.wasModified){
      index.saveObject(this.toObject({
        transform: function(doc,ret) {
          delete ret._id;

          if(options && options.selector) ret = applySelector(ret);

          ret.objectID = doc._id;

          return ret;
        }
      }),(err, content) => {
        if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
        if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Updated'),' -> ObjectId: ', content.objectID);
      });
    }
  });

  schema.post('remove',function(){
    index.deleteObject(this._id,err => {
      if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
      if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Deleted'),' -> ObjectId: ', this._id);
    });
  });

  function applySelector(doc) {
    let keys = options.selector.split(' ');
    let remove = keys.filter(key => /^-{1}.+/.test(key)).map(key => key.substring(1));
    let keep = keys.filter(key => /^(?!-{1}).+/.test(key));

    if(keep.length){
      for(let key in doc) {
        if(!keep.includes(key)) { delete doc[key] };
      }
    }else if(remove.length) {
      remove.forEach(key => { delete doc[key] });
    }

    return doc;
  }
}
