'use strict'

const algolia = require('algoliasearch')
const clc = require('cli-color')

const utils = require('./utils')

module.exports = function (settings, options, client) {
  this.find().exec((err, docs) => {
    if (err)
      return console.error(
        clc.blackBright(`[${new Date().toLocaleTimeString()}]`),
        clc.cyanBright('[Algolia-sync]'),
        ' -> ',
        clc.red.bold('Error'),
        ' -> ',
        err,
      )

    let indices = []

    docs.forEach(doc => {
      utils.GetIndexName(doc, options.indexName).then(_indices => {
        if (_indices instanceof Array) _indices.forEach(entry => addToIndex(entry))
        else addToIndex(_indices)

        function addToIndex(entry) {
          if (!indices.includes(entry)) {
            indices.push(entry)
          }
        }
      })
    })

    indices.forEach(currentIndexName => {
      let currentIndex = client.initIndex(currentIndexName)

      currentIndex.setSettings(settings, err => {
        if (err)
          return console.error(
            clc.blackBright(`[${new Date().toLocaleTimeString()}]`),
            clc.cyanBright('[Algolia-sync]'),
            ' -> ',
            clc.red.bold('Error'),
            ' -> ',
            err,
          )
        if (options.debug)
          console.log(
            clc.blackBright(`[${new Date().toLocaleTimeString()}]`),
            clc.cyanBright('[Algolia-sync]'),
            ' -> ',
            clc.greenBright('Updated Settings'),
            ' -> ',
            currentIndexName,
          )
      })
    })
  })
}
