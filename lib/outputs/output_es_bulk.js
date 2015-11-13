var abstract_http = require('./abstract_http'),
  util = require('util'),
  elastic_search_helper = require('../lib/elastic_search_helper');

function OutputEsBulk() {
  abstract_http.AbstractHttp.call(this);
  this.mergeConfig({
    name: 'ES Bulk',
    optional_params: ['bulk_limit', 'bulk_timeout', 'index_name', 'data_type', 'id_field', 'root'],
    default_values: {
      'index_prefix': 'logstash',
      'data_type': 'logs',
      'bulk': 'false',
      'bulk_timeout': '1000'
    },
    start_hook: this.start,
  });
}

util.inherits(OutputEsBulk, abstract_http.AbstractHttp);

OutputEsBulk.prototype.start = function(callback) {
  if (this.bulk_limit) {
    this.bulk_limit = parseInt(this.bulk_limit, 10);
    this.bulk_timeout = parseInt(this.bulk_timeout, 10);
    this.bulk_data = [];
    this.bulk_interval = setInterval(function() {
      if (this.bulk_data.length > 0 && ((new Date()).getTime() - this.last_bulk_insert) > this.bulk_timeout) {
        this.sendBulk();
      }
    }.bind(this), this.bulk_timeout);
  }

  callback();
};

OutputEsBulk.prototype.getPath = function() {
  return '/' + this.index_name + '/' + this.data_type + '/';
};

OutputEsBulk.prototype.buildBulkPayload = function () {
  function addIdField(id_field) {
    if (id_field) {
      return function (obj) {
        return '{"index":' +
            (obj.hasOwnProperty(id_field) ? '{"_id":"' + obj[id_field] + '"}}\n' : '{}}\n') +
            JSON.stringify(obj)
            ;
      }
    }
    return function (obj) {
      return '{"index":{}}\n' + JSON.stringify(obj);
    }
  }

  return this.bulk_data.map(addIdField(this.id_field)).join('\n');
};

OutputEsBulk.prototype.sendBulk = function() {
  var path = this.getPath() + '/_bulk';
  var payload = this.buildBulkPayload();
  this.bulk_data = [];
  this.postData(path, payload + '\n');
};

OutputEsBulk.prototype.postData = function(path, data) {
  var params = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: path,
  };

  this.sendHttpRequest(params, data);
};

OutputEsBulk.prototype.process = function(data) {
  var root = this.root? data[this.root]: data;
  if (root instanceof Array){
    for (var i=0; i<root.length; i++){
      this.processDocument(root[i]);
    }
  } else {
    this.processDocument(root);
  }
};

OutputEsBulk.prototype.processDocument = function(data) {
  if (this.bulk_limit) {
    this.bulk_data.push(data);
    this.last_bulk_insert = (new Date()).getTime();
    if (this.bulk_data.length >= this.bulk_limit) {
      this.sendBulk();
    }
  }
  else {
    this.postData(this.getPath(), JSON.stringify(data));
  }
};

OutputEsBulk.prototype.httpClose = function(callback) {
  if (this.bulk_interval) {
    clearInterval(this.bulk_interval);
  }
  callback();
};

OutputEsBulk.prototype.to = function() {
  return ' Elastic Search Http ' + this.host + ':' + this.port + (this.bulk_limit ? ' bulk ' + this.bulk_limit : '');
};

exports.create = function() {
  return new OutputEsBulk();
};
