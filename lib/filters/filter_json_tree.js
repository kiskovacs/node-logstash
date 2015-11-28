var base_filter = require('../lib/base_filter'),
    util = require('util'),
    opath = require('object-path'),
    logger = require('log4node');


function FilterJsonTree() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'JsonParse',
    host_field: 'from',
    optional_params: ['to','move']
  });
}

util.inherits(FilterJsonTree, base_filter.BaseFilter);

FilterJsonTree.prototype.process = function(data) {
  try {
    var obj = opath.get(data, this.from, {});
    if (this.move){
      opath.del(data, this.from);
    }
    if (this.to){
      opath.set(data, this.to, obj);
      return data;
    }
    return util._extend(data, obj);
  }
  catch (e) {
    logger.error(e);
    return data;
  }
};

exports.create = function() {
  return new FilterJsonTree();
};
