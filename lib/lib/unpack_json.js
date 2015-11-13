module.exports = exports = function(data, ok_callback, parse_fail_callback) {
    try {
        var ok = false;
        var splitted = data.toString().split('\n');
        for (var i = 0; i < splitted.length; i++) {
            if (splitted[i] !== '') {
                var parsed = JSON.parse(splitted[i]);
                    ok_callback(parsed);
                    ok = true;
            }
        }
        if (ok) {
            return;
        }
    }
    catch (e) {}
    return parse_fail_callback(data);
};