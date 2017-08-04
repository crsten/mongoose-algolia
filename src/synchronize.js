'use strict';

const algolia = require('algoliasearch');
const clc = require('cli-color');

const utils = require('./utils');

module.exports = function(options,client){

  return new Promise((resolve,reject) => {
    let query = this.find();

    if(options.populate){
      query = query.populate(options.populate);
    }

    query.exec((err, docs) => {
      if(err) {
        reject(err);
        return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
      }

      let indicesMap = {};

      docs.forEach(doc => {
        let indices = utils.GetIndexName(doc,options.indexName);

        if(indices instanceof Array) indices.forEach(entry => addToIndex(entry, doc));
        else addToIndex(indices, doc);

        function addToIndex(entry, item) {
          if(indicesMap[entry]){
            indicesMap[entry].push(item);
          }else{
            indicesMap[entry] = [item];
          }
        }
      });

      let operations = Object.keys(indicesMap).map(currentIndexName => {
        return new Promise((innerResolve, innerReject) => {

          let currentIndex = client.initIndex(currentIndexName);
          currentIndex.clearIndex((err) => {
            if(err) {
              innerReject(err);
              return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
            }
            if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Cleared Index'),' -> ',currentIndexName);

            let objects = indicesMap[currentIndexName];

            if(options.filter) objects = objects.filter(obj => options.filter(obj._doc));

            objects = objects.map(obj => {
              return obj.toObject({
                versionKey: false,
                transform: function(doc,ret) {
                  if (doc.constructor.modelName !== obj.constructor.modelName) return ret;

                  delete ret._id;
                  delete ret.__v;
                  ret = utils.ApplyVirtuals(ret, options.virtuals);
                  ret = utils.ApplyMappings(ret, options.mappings);
                  ret = utils.ApplyDefaults(ret, options.defaults);
                  ret = utils.ApplySelector(ret,options.selector);

                  ret.objectID = doc._id;

                  return ret;
                }
              });
            });

            currentIndex.saveObjects(objects,(err, content) => {
              if(err) {
                innerReject(err);
                return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
              }

              if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Synchronized Index'),' -> ',currentIndexName);
              innerResolve();
            });
          });

        });
      })

      Promise.all(operations).then((result) => {resolve();}).catch(reject);
    });
  });

}
