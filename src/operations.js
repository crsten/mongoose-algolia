'use strict';

const utils = require('./utils');
const clc = require('cli-color');

module.exports = function(options,client){

  this.pre('save',function(next) {

    let isModified = false;

    let relevantKeys = utils.GetRelevantKeys(this.toJSON(), options.selector);
    if(relevantKeys && relevantKeys.length) {
      relevantKeys.forEach(key => {
        if(this.isModified(key)) isModified = true;
      });
    }else{
      if(this.isModified()) isModified = true;
    }

    this.wasNew = this.isNew;
    this.wasModified = isModified;
    next();
  });

  this.post('save',function() {
    let indices = utils.GetIndexName(this,options.indexName);
    if(indices instanceof Array) {
      indices.forEach(index => SyncItem(this, client.initIndex(index)));
    }else{
      SyncItem(this, client.initIndex(indices));
    }
  });

  this.post('remove',function(){
    let indices = utils.GetIndexName(this,options.indexName);
    if(indices instanceof Array) {
      indices.forEach(index => RemoveItem(this, client.initIndex(index)));
    }else{
      RemoveItem(this, client.initIndex(indices));
    }
  });

  function RemoveItem(context, index) {
    index.deleteObject(context._id.toString(),err => {
      if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
      if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Deleted'),' -> ObjectId: ', context._id);
    });
  }

  function SyncItem(context, index){
    if(options.filter && !options.filter(context._doc)) {
      RemoveItem(context, index);
    }else if(context.wasNew) {
      utils.ApplyPopulation(context,options.populate).then(populated => {
        index.addObject(populated.toObject({
          versionKey: false,
          transform: function(doc,ret) {
            if (doc.constructor.modelName !== populated.constructor.modelName) return ret;

            delete ret._id;
            ret = utils.ApplyVirtuals(ret, options.virtuals);
            ret = utils.ApplyMappings(ret, options.mappings);
            ret = utils.ApplyDefaults(ret, options.defaults);
            return utils.ApplySelector(ret,options.selector);
          }
        }),context._id,(err,content) => {
          if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
          if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Created'),' -> ObjectId: ',content.objectID);
        });
      }).catch(err => {
        console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error (at population)'),' -> ',err);
      });
    }else if(context.wasModified){
      utils.ApplyPopulation(context,options.populate).then(populated => {
        index.saveObject(populated.toObject({
          versionKey: false,
          transform: function(doc,ret) {
            if (doc.constructor.modelName !== populated.constructor.modelName) return ret;

            delete ret._id;
            ret = utils.ApplyVirtuals(ret, options.virtuals);
            ret = utils.ApplyMappings(ret, options.mappings);
            ret = utils.ApplyDefaults(ret, options.defaults);
            ret = utils.ApplySelector(ret,options.selector);

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
  }
}
