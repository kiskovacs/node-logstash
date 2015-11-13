var base_input = require('../lib/base_input'),
  util = require('util'),
  redis_connection_manager = require('../lib/redis_connection_manager'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function InputRedisHash() {
  base_input.BaseInput.call(this);
  this.mergeConfig(error_buffer.config(function() {
    return 'input Redis to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'channel', 'key', 'retry', 'auth_pass'],
    default_values: {
    },
    start_hook: this.start,
  });
}

util.inherits(InputRedisHash, base_input.BaseInput);

InputRedisHash.prototype.hashValues = function(client) {
  client.hvals(this.key, function(err, data) {
    if (data) {
      for(var i=0; i<data.length; i++) try {
        var parsed = JSON.parse(data[i]);
        if (this.type) {
          parsed.type = this.type;
        }
        this.emit('data', parsed);
      } catch (error){
        this.emit('error', 'Unable to parse data: ' + data[i] + ' error:'+ error);
        if (parsed){
            this.emit('data', parsed);
        }
      }
    }
  }.bind(this));
};

InputRedisHash.prototype.start = function(callback) {
  var receive = null;

  if (!this.key) {
    return callback(new Error('You have to specify the key parameter in hvals mode'));
  }
  this.desc = 'using hvals, key ' + this.key;
  receive = this.hashValues.bind(this);


  logger.info('Start listening Redis on', this.host + ':' + this.port, this.desc);

  this.redis_connection_manager = redis_connection_manager.create(this.host, this.port, this.auth_pass);

  this.redis_connection_manager.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  this.redis_connection_manager.on('connect', function() {
    this.error_buffer.emit('ok');
  }.bind(this));

  this.redis_connection_manager.once('connect', receive);

  callback();
};

InputRedisHash.prototype.close = function(callback) {
  this.quitting = true;
  this.redis_connection_manager.quit(callback);
};

exports.create = function() {
  return new InputRedisHash();
};
