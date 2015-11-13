var base_output = require('../lib/base_output'),
  util = require('util'),
  redis_connection_manager = require('../lib/redis_connection_manager'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function OutputRedisHash() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig(error_buffer.config(function() {
    return 'output Redis to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig({
    name: 'RedisHash',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['auth_pass', 'key', 'field','channel', 'merge'],
    default_values: {
      method: 'queue'
    },
    start_hook: this.start
  });
}

util.inherits(OutputRedisHash, base_output.BaseOutput);

OutputRedisHash.prototype.hashSet = function(data) {
    var key = this.replaceByFields(data, this.key),
      field_name = this.replaceByFields(data, this.field);

    this.client.hget(key,field_name, function(err, obj){
        var out = data;
        if (obj && this.merge){
            out = JSON.parse(obj);
            for(var field in data){
                if (data.hasOwnProperty(field)){
                    out[field] = data[field];
                }
            }
        }
        if (!this.client.hset(key, field_name, this.serialize_data(out))) {
            this.error_buffer.emit('error', 'Unable to hset message on redis to key ' + key + ' and fieldname ' +field_name);
        }
    }.bind(this));

};

OutputRedisHash.prototype.start = function(callback) {
  this.send = null;

  if (!this.key) {
    return callback(new Error('You have to specify the key parameter in hset mode'));
  }
  if (!this.fieldname) {
    return callback(new Error('You have to specify the fieldname parameter in hset mode'));
  }
  this.desc = 'using hset, key ' + this.key + 'and fieldname ' + this.fieldname;
  this.send = this.hashSet.bind(this);

  logger.info('Start Redis output to', this.host + ':' + this.port, this.desc);

  this.redis_connection_manager = redis_connection_manager.create(this.host, this.port, this.auth_pass);

  this.redis_connection_manager.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  this.redis_connection_manager.on('connect', function() {
    this.error_buffer.emit('ok');
  }.bind(this));

  this.redis_connection_manager.once('connect', function(client) {
    this.client = client;
  }.bind(this));

  callback();
};

OutputRedisHash.prototype.process = function(data) {
  if (this.client) {
    this.send(data);
  }
  else {
    this.error_buffer.emit('ok');
  }
};

OutputRedisHash.prototype.close = function(callback) {
  this.redis_connection_manager.quit(callback);
};

exports.create = function() {
  return new OutputRedisHash();
};
