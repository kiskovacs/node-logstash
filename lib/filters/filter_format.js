var base_filter = require('../lib/base_filter'),
    util = require('util'),
    opath = require('object-path');
    logger = require('log4node');

function FilterFormat() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'ComputeField',
    required_params: ['value'],
    host_field: 'field',
    optional_params: ['root'],
    start_hook: this.start
  });
}

util.inherits(FilterFormat, base_filter.BaseFilter);

FilterFormat.prototype.start = function(callback) {
  logger.info('Initialized compute field filter on field: ' + this.field + ', value: ' + this.value);
  callback();
};

FilterFormat.prototype.process = function(data) {
  var params = this.root? opath.get(data, this.root, null): data;
  if(params) {
    var value = this.value.replace(/#\{\w+}/g, function (all) {
      var name = all.slice(2, -1);
      return opath.get(params, name, '');
    });
    if (value) {
      opath.set(data, this.field, value);
    }
  }
  return data;
};

exports.create = function() {
  return new FilterFormat();
};
