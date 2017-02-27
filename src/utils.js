'use strict';

function GetIndexName(doc,indexName) {
  return (typeof indexName === 'string') ? indexName : indexName.call(null,doc) ;
}

function ApplyPopulation(doc,populate) {
  return new Promise((resolve,reject) => {
    if(!populate) return resolve(doc);

    doc.populate(populate,(err, populatedDoc) => {
      if(err) return reject(err);
      return resolve(populatedDoc);
    });
  });
}

function ApplyMappings(doc, mappings) {
  if(!mappings) return doc;

  Object.keys(mappings).forEach(key => {
    if(mappings[key] instanceof Array === false && typeof mappings[key] === 'object') {
      if(doc[key] instanceof Array === false && typeof doc[key] === 'object'){
        doc[key] = ApplyMappings(doc[key], mappings[key]);
      }
    }else{
      if (doc[key]) {
        doc[key] = mappings[key](doc[key]);
      }
    }
  });

  return doc;
}

function ApplyDefaults(doc, defaults) {
  if(!defaults) return doc;

  Object.keys(defaults).forEach(key => {
    if(defaults[key] instanceof Array === false && typeof defaults[key] === 'object'){
      doc[key] = ApplyDefaults(doc[key] || {}, defaults[key]);
    }else{
      if((doc[key] instanceof Array && !doc[key].length) || !doc[key]) doc[key] = defaults[key];
    }
  });

  return doc;
}

function ApplySelector(doc,selector) {
  if(!selector) return doc;

  let keys = selector.split(' ');
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

module.exports = {
  GetIndexName,
  ApplySelector,
  ApplyPopulation,
  ApplyDefaults,
  ApplyMappings
}
