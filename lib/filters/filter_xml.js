var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node'),
  xmljson = require('xmljson');

function FilterXML() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'XML',
    required_params: [],
    optional_params: [],
    default_values: {
    },
    host_field: 'field_name',
    start_hook: this.start
  });
}

util.inherits(FilterXML, base_filter.BaseFilter);

FilterXML.prototype.start = function(callback) {
  logger.info('Initialized XML filter');
  callback();
};

FilterXML.prototype.init = function(url, callback) {
  logger.info('Initializing filter', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      return callback(err);
    }

    this.on('input', function(data) {
      if (this.processMessage(data)) {
        try {
          xmljson.to_json(data[url], function(error, result){
            if (error){
              this.emit('error', 'Unable to parse data: ' + error);
            } else {
              this.emit('output', result);
            }
          }.bind(this));
        } catch (error){
          //dont report unmatched closing tag
        }
      }
      else {
        this.emit('output', data);
      }
    }.bind(this));

    callback();
  }.bind(this));
};

exports.create = function() {
  return new FilterXML();
};
