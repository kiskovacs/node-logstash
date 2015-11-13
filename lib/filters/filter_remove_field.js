var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterRemoveField() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'RemoveField',
    host_field: 'field',
    optional_params: ['value'],
    start_hook: this.start
  });
}

util.inherits(FilterRemoveField, base_filter.BaseFilter);

FilterRemoveField.prototype.start = function(callback) {
  logger.info('Initialized remove field', this.field, 'when equal to', this.value);
  callback();
};

FilterRemoveField.prototype.process = function(data) {
  if (this.value === undefined || data[this.field] === this.value) {
    delete data[this.field];
  }
  return data;
};

exports.create = function() {
  return new FilterRemoveField();
};
