var base_filter = require('../lib/base_filter'),
  logger = require('log4node'),
  util = require('util');

function FilterJsonArray() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'JsonArray',
    optional_params: ['from','set','value','remove','array','concat'],
    default_values:{
      from: 'message'
    },
    host_field: 'field_name',
    start_hook: this.start
  });
}

util.inherits(FilterJsonArray, base_filter.BaseFilter);


FilterJsonArray.prototype.start = function(callback) {
  logger.info('Initialized JSON array filter on field: ' + this.field_name + ', from: ' + this.from);
  callback();
};

FilterJsonArray.prototype.process = function(data) {
  try {
    var results = JSON.parse(data[this.from]);
    if (this.set){
      var value = this.replaceByFields(data, this.value);
      results.forEach( function(doc){
        doc[this.set] = value;
      }.bind(this));
    }
    if (this.array) {
      var keys = this.array.split('_');
      results.forEach( function(doc){
        var merge = [];
        for(var i=0;i<keys.length;i++){
          merge.push(doc[keys[i]]);
          delete doc[keys[i]];
        }
        doc[this.array] = merge;
      }.bind(this));
    }
    if (this.concat) {
      var keys = this.concat.split('_');
      results.forEach( function(doc){
        var merge = [];
        for(var i=0;i<keys.length;i++){
          merge.push(doc[keys[i]]);
          delete doc[keys[i]];
        }
        doc[this.concat] = merge.join(',');
      }.bind(this));
    }
    if (this.remove) {
      results.forEach( function(doc){
        delete doc[this.remove];
      }.bind(this));
    }
    data[this.field_name] = results;
  }
  catch (e) {
    logger.error('Cannot parse JSON array:' + e.message);
  }

  return data;
};

exports.create = function() {
  return new FilterJsonArray();
};
