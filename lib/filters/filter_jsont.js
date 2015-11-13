var base_filter = require('../lib/base_filter')
    , logger = require('log4node')
    , fs = require('fs')
    , util = require('util')
    , helper = require('../lib/jsont_helper')
    , jsont = require('jsont')()
    ;
/**
 * Compact arrays with null entries; delete keys from objects with null value
 */
function removeNulls(obj){
  for (var key in obj){
    if (obj[key]===null || obj[key]===undefined){
      if(obj instanceof Array) {
        obj.splice(key,1);
      }  else {
        delete obj[key];
      }
    }
    else if (typeof obj[key]=="object") removeNulls(obj[key]);
  }
}

function FilterJsont() {
    base_filter.BaseFilter.call(this);
    this.mergeConfig({
        name: 'Jsont',
        host_field:'template',
        start_hook: this.start,
        optional_params: ['root','field_name'],
        default_values: {
            root:'fields'
        }
    });
}

util.inherits(FilterJsont, base_filter.BaseFilter);

FilterJsont.prototype.start = function(callback) {
    logger.info('Initializing jsont filter');
    jsont.plugin(helper);
    fs.readFile(this.template, function(err, content){
        if (err){
            this.error('Could not load template file:'+this.template+', error:' + err.message);
            callback(err);
        } else try {
            this.template = JSON.parse(content);
            this.json_template = jsont.compile(this.template);
            callback()
        } catch (err){
            logger.error('Could not parse template file:'+this.template+', error:' + err.message);
            callback(err)
        }
    }.bind(this));
};

FilterJsont.prototype.process = function (data) {
    var obj = {};
    obj[this.root] = this.field_name? data[this.field_name]: data;
    this.json_template(obj, function (err, out) {
        if (err) {
            this.emit('error', 'Could not apply json template, error:' + err.message);
        } else {
            removeNulls(out);
            this.emit('output', out);
        }
    }.bind(this));
};


exports.create = function() {
    return new FilterJsont();
};
