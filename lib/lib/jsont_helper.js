/**
 * Created by stefan on 13.2.15.
 */
module.exports = exports = function(jsont){

  jsont.use('to-int', function(input, next) {
    var parsed = parseInt(input);
    next(null, isNaN(parsed)? null:parsed);
  });

  jsont.use('on-field', function(input, field, action, next) {
    this.helpers[action](input[field], function(error, result){
      if ( error){
        next(error);
      } else {
        input[field] = result;
        next(null, input);
      }
    });
  }.bind(jsont));


  jsont.use('rename', function(input, from, to, next) {
    input[to] = input[from];
    delete input[from];
    next(null, input);
  });


  jsont.use('to-float', function(input, next) {
    var parsed = parseFloat(input);
    next(null, isNaN(parsed)? null:parsed);
  });

  function parseBool(val) {
    if (isNaN(val)){
       return val.toLowerCase() === 'true' || val.toLowerCase() === 'yes';
    }
    return val>0;
  }

  jsont.use('to-boolean', function(input, next) {
    next(null, parseBool(input));
  });

  jsont.use('not', function(input, next) {
    next(null, !input);
  });

  jsont.use('to-list', function(input, next) {
    var result = [];
    if (input) {
      for (var key in input) {
        if (input.hasOwnProperty(key)) {
          result.push(input[key]);
        }
      }
    }
    next(null, result);
  });

  jsont.use('value-of', function(input, key, next) {
    next(null, input[key]);
  });


  jsont.use('prefix', function(input, prefix, next) {
    next(null, prefix + input);
  });

  jsont.use('join', function() {
    if (arguments.length>2 && arguments[0]) {
      var input = arguments[0],
        next = arguments[arguments.length-1],
        values = [];
      for(var i=1; i<arguments.length-1;i++){
        if (input.hasOwnProperty(arguments[i])) {
          values.push(input[arguments[i]]);
        }
      }
      next(null, values.join(' '));
    }
  });

  jsont.use('or', function() {
    if (arguments.length>2 && arguments[0]) {
      var input = arguments[0],
        next = arguments[arguments.length-1];
      for(var i=1; i<arguments.length-1;i++){
        if (input.hasOwnProperty(arguments[i])) {
          var value = input[arguments[i]];
          if (value){
            next(null, value);
          }
        }
      }
    }
  });

  jsont.use('infix', function(input, infix, where, next) {
    if (input) {
      var pos = parseInt(where)
        , string = input.toString()
        ;
      next(null, string.substr(0, pos) + infix + string.substr(pos));
    } else {
      next(null,null);
    }
  });

  jsont.use('time', function(input, next){
    next(null, new Date(input).getTime());
  });
};