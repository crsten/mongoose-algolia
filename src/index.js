'use strict';

const algolia = require('algoliasearch');
const clc = require('cli-color');

module.exports = exports = function algoliaIntegration(schema,options) {
  if(!options || !options.indexName) console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> options.indexName is required');
  if(!options || !options.appId) console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> options.appId is required');
  if(!options || !options.apiKey) console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> options.apiKey is required');

  const client = algolia(options.appId,options.apiKey);
  const index = (typeof options.indexName === 'string') ? client.initIndex(options.indexName) : null ;

  schema.pre('save',function(next) {
    this.wasNew = this.isNew;
    this.wasModified = this.isModified();
    next();
  });

  schema.post('save',function() {
    let currentIndex = GetIndex(this);
    if(this.wasNew) {
      applyPopulation(this).then(populated => {
        currentIndex.addObject(populated.toObject({
          transform: function(doc,ret) {
            delete ret._id;
            if(options && options.selector) ret = applySelector(ret);
            return ret;
          }
        }),this._id,(err,content) => {
          if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
          if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Created'),' -> ObjectId: ',content.objectID);
        });
      }).catch(err => {
        console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error (at population)'),' -> ',err);
      });
    }else if(this.wasModified){
      applyPopulation(this).then(populated => {
        currentIndex.saveObject(populated.toObject({
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
      }).catch(err => {
        console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error (at population)'),' -> ',err);
      });
    }
  });

  schema.post('remove',function(){
    let currentIndex = GetIndex(this);
    currentIndex.deleteObject(this._id,err => {
      if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
      if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Deleted'),' -> ObjectId: ', this._id);
    });
  });

  function GetIndex(doc) {
    return index || client.initIndex(options.indexName.call(null,doc));
  }

  function applyPopulation(doc) {
    return new Promise((resolve,reject) => {
      if(!options.populate) return resolve(doc);

      doc.populate(options.populate,(err, populatedDoc) => {
        if(err) return reject(err);
        return resolve(populatedDoc);
      });
    });
  }

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
