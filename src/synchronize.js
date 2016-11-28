'use strict';

const algolia = require('algoliasearch');
const clc = require('cli-color');

const utils = require('./utils');

module.exports = function(options,client){

  return new Promise((resolve,reject) => {
    let query = this.find();

    if(options.selector) {
      query = query.select(options.selector);
    }

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
        let currentIndexName = utils.GetIndexName(doc,options.indexName);

        if(indicesMap[currentIndexName]){
          indicesMap[currentIndexName].push(doc);
        }else{
          indicesMap[currentIndexName] = [doc];
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

            let objects = indicesMap[currentIndexName].map(obj => {
              return obj.toObject({
                versionKey: false,
                transform: function(doc,ret) {
                  if (doc.constructor.modelName !== obj.constructor.modelName) return ret;

                  delete ret._id;
                  delete ret.__v;

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
