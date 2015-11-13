var base_filter = require('../lib/base_filter')
  , util = require('util')
  , logger = require('log4node')
  , http = require('http')
  , https = require('https')
  , iconv = require('iconv-lite')
  , entities = require("entities")
  ;

function FilterHTTPGet() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'HTTP Get',
    required_params: [],
    optional_params: [],
    default_values: {
      },
    host_field: 'field_name',
    start_hook: this.start
  });
}

util.inherits(FilterHTTPGet, base_filter.BaseFilter);

FilterHTTPGet.prototype.start = function(callback) {
  logger.info('Initialized HTTP Get filter');
  callback();
};

FilterHTTPGet.prototype.init = function(url, callback) {
  logger.info('Initializing filter', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      return callback(err);
    }

    this.on('input', function(data) {
      if (this.processMessage(data)) {
        try {
          var request, uri;
          if( data.http_secure){
            request = https;
            uri = 'https://' + url;
          } else {
            request = http;
            uri = 'http://' + url;
          }
          request.get( this.replaceByFields(data, uri), function(res){
              data.message = '';
              res.rawBuffer = new Buffer(0);

              res.on('data',function(chunk) {
                res.rawBuffer = Buffer.concat([res.rawBuffer,chunk]);
              });

              res.on('end',function(err) {
                data.message = entities.decodeHTML(
                  iconv.decode(
                    res.rawBuffer, data.http_encoding? data.http_encoding: 'utf-8'
                  )
                );
                this.emit('output', data);
              }.bind(this));

            }.bind(this)
          ).on('error', function(error){
              this.emit('error', 'Unable to get data: ' + error);
            }.bind(this));
        } catch (error){
          logger.error(error);
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
  return new FilterHTTPGet();
};
