'use strict';

const utils = require('./utils');
const clc = require('cli-color');

module.exports = function(options,client){

  this.pre('save',function(next) {
    this.wasNew = this.isNew;
    this.wasModified = this.isModified();
    next();
  });

  this.post('save',function() {
    let index = client.initIndex(utils.GetIndexName(this,options.indexName));
    if(this.wasNew) {
      utils.ApplyPopulation(this,options.populate).then(populated => {
        index.addObject(populated.toObject({
          versionKey: false,
          transform: function(doc,ret) {
            if (doc.constructor.modelName !== populated.constructor.modelName) return ret;

            delete ret._id;
            return utils.ApplySelector(ret,options.selector);
          }
        }),this._id,(err,content) => {
          if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
          if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Created'),' -> ObjectId: ',content.objectID);
        });
      }).catch(err => {
        console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error (at population)'),' -> ',err);
      });
    }else if(this.wasModified){
      utils.ApplyPopulation(this,options.populate).then(populated => {
        index.saveObject(populated.toObject({
          versionKey: false,
          transform: function(doc,ret) {
            if (doc.constructor.modelName !== populated.constructor.modelName) return ret;

            delete ret._id;
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
  });

  this.post('remove',function(){
    let index = client.initIndex(utils.GetIndexName(this,options.indexName));
    index.deleteObject(this._id.toString(),err => {
      if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
      if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Deleted'),' -> ObjectId: ', this._id);
    });
  });
}
