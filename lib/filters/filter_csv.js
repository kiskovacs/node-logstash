var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterCSV() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'CSV',
    required_params: ['delimiter', 'columns'],
    optional_params: ['from','empty'],
    default_values: {
      from: 'message',
      empty: false
    },
    start_hook: this.start
  });
}

util.inherits(FilterCSV, base_filter.BaseFilter);

FilterCSV.prototype.start = function(callback) {
  this.columns = this.columns.split(this.delimiter);
  logger.info('Initialized CSV filter with delimiter: ' + this.delimiter + ' and #columns:' + this.columns.length);
  callback();
};

FilterCSV.prototype.emptyColumns = function(data) {
  if (this.empty){
    for (var i = 0; i < this.columns.length; i++) {
      if( data[this.columns[i]]) {
        return false;
      }
    }
  }
  return true;
};

FilterCSV.prototype.process = function(data) {
  if (this.emptyColumns(data)) try {
    var split = data[this.from].split(this.delimiter);
    for (var i = 0; i < this.columns.length; i++) {
      data[this.columns[i]] = split[i];
    }
  } catch (error){
    this.emit('error', 'Unable to parse data: ' + error);
  }
  return [data];
};

exports.create = function() {
  return new FilterCSV();
};
