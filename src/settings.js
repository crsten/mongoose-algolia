'use strict';

const algolia = require('algoliasearch');
const clc = require('cli-color');

const utils = require('./utils');

module.exports = function(settings,options,client){
  this.find()
  .exec((err, docs) => {
    if(err) {
      reject(err);
      return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
    }

    let indices = [];

    docs.forEach(doc => {
      let currentIndexName = utils.GetIndexName(doc,options.indexName);

      if(!indices.includes(currentIndexName)){
        indices.push(currentIndexName);
      }
    });

    indices.forEach(currentIndexName => {
        let currentIndex = client.initIndex(currentIndexName);

        currentIndex.setSettings(settings,(err) => {
          if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
          if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Updated Settings'),' -> ',currentIndexName);
        });
    });

  });

}
