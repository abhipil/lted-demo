'use strict';

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var strictUriEncode = function (str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
};

var parse = function (str) {
    // Create an object with no prototype
    // https://github.com/sindresorhus/query-string/issues/47
    var ret = Object.create(null);

    if (typeof str !== 'string') {
        return ret;
    }

    str = str.trim().replace(/^(\?|#|&)/, '');
    if (!str) {
        return ret;
    }

    str.split('&').forEach(function (param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        // Firefox (pre 40) decodes `%3D` to `=`
        // https://github.com/sindresorhus/query-string/pull/37
        var key = parts.shift();
        var val = parts.length > 0 ? parts.join('=') : undefined;

        key = decodeURIComponent(key);

        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);

        if (ret[key] === undefined) {
            ret[key] = val;
        } else if (Array.isArray(ret[key])) {
            ret[key].push(val);
        } else {
            ret[key] = [ret[key], val];
        }
    });

    return ret;
};


function encode(value, opts) {
    if (opts.encode) {
        return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
    }

    return value;
}

var stringify = function (obj, opts) {
    var defaults = {
        encode: true,
        strict: true
    };

    opts = Object.assign(defaults, opts);

    return obj ? Object.keys(obj).sort().map(function (key) {
        var val = obj[key];

        if (val === undefined) {
            return '';
        }

        if (val === null) {
            return encode(key, opts);
        }

        if (Array.isArray(val)) {
            var result = [];

            val.slice().forEach(function (val2) {
                if (val2 === undefined) {
                    return;
                }

                if (val2 === null) {
                    result.push(encode(key, opts));
                } else {
                    result.push(encode(key, opts) + '=' + encode(val2, opts));
                }
            });

            return result.join('&');
        }

        return encode(key, opts) + '=' + encode(val, opts);
    }).filter(function (x) {
        return x.length > 0;
    }).join('&') : '';
};

var client_id = '526266e0e2764b2fb64b659d4f31ee5e'; // Your client id
var redirect_uri = 'http://localhost:8000/'; // Your redirect uri
var base = "NTI2MjY2ZTBlMjc2NGIyZmI2NGI2NTlkNGYzMWVlNWU6MjI5YWUyN2Y1ZTkxNDdjZTgzYWQzNzEwZjFlZDcwYmM=";

var stateKey = 'spotify_auth_state';

$(".spotify-connect").click(function() {
    var state = generateRandomString(16);
    Cookies.set(stateKey, state);
    var scope = 'user-read-private user-read-email';
    location.href = 'https://accounts.spotify.com/authorize?' +
                stringify({
                  response_type: 'code',
                  client_id: client_id,
                  scope: scope,
                  redirect_uri: redirect_uri,
                  state: state
                });
});

$( document ).ready(function() {
    var options = parse(window.location.href.replace(window.location.origin+'/?',''));
    console.log(options);
    var code = options.code || null;
    var state = options.state || null;
    var storedState = Cookies.get(stateKey) ? Cookies.get(stateKey) : null;
    if (state === null || state !== storedState) {
        // location.href = redirect_uri;
        return;
    } else {
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + base
            },
            body: JSON.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            }),
            credentials: 'include'
        }).then(function(json) {
            console.log('parsed json', json)
        }).catch(function(ex) {
            console.log('parsing failed', ex)
        });

        // http.post({
        //     url: 'https://accounts.spotify.com/api/token',
        //     data: JSON.stringify({
        //             code: code,
        //             redirect_uri: redirect_uri,
        //             grant_type: 'authorization_code'
        //         }),
        //     headers: {
        //         'Authorization': 'Basic ' + base
        //     },
        //     contentType: 'application/json',
        //     onload: function() { console.log(JSON.parse(this.responseText)) }
        // });
    }
});
