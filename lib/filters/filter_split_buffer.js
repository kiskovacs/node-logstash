var base_filter_buffer = require('../lib/base_filter_buffer'),
  util = require('util'),
  logger = require('log4node');

function FilterSplitBuffer() {
  base_filter_buffer.BaseFilterBuffer.call(this);
  this.mergeConfig({
    name: 'Split',
    required_params: ['delimiter'],
    optional_params: ['max_delay'],
    start_hook: this.start
  });
}

util.inherits(FilterSplitBuffer, base_filter_buffer.BaseFilterBuffer);

FilterSplitBuffer.prototype.start = function(callback) {
  logger.info('Initialized split filter with delimiter: ' + this.delimiter);
  if (this.max_delay) {
    this.setInterval(this.max_delay);
  }
  callback();
};

FilterSplitBuffer.prototype.createMessage = function(data, text) {
  var m = JSON.parse(JSON.stringify(data));
  m.message = text;
  return m;
};

FilterSplitBuffer.prototype.process = function(data) {
  var key = this.computeKey(data), current, result = [], from = 0;
  if(this.storage[key]){
    current = this.storage[key].first + data.message;
  } else {
    current = data.message;
  }
  while (true) {
    var index = current.indexOf(this.delimiter, from);
    if (index === -1) {
      break;
    }
    var before = current.substring(0, index);
    current = current.substring(index);
    from = this.delimiter.length;
    if (before.length > 0) {
      result.push(this.createMessage(data, before));
    }
  }
  delete this.storage[key];
  if (current.length > 0) {
      this.store(key, current);
  }
  return result;
};

exports.create = function() {
  return new FilterSplitBuffer();
};
