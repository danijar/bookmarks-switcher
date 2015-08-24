// Get the values of one of more storage variables passed as arguments to the
// callback. If a key is not found, null will be passed for it instead.
function storage_get() {
  var keys = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  keys = [].concat.apply([], keys)
  var callback = arguments[arguments.length - 1];
  chrome.storage.local.get(keys, function (items) {
    var values = [];
    for (var i = 0; i < keys.length; ++i)
      values.push(items[keys[i]] || null);
    callback.apply(null, values);
  });
}

// Given one or more keys, the callback will be called on each key that doesn't
// exist as a storage variable yet.
function storage_not_exist() {
  var keys = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  keys = [].concat.apply([], keys)
  var callback = arguments[arguments.length - 1];
  for (var i = 0; i < keys.length; ++i) {
    (function(key) {
      storage_get(key, function (value) {
        if (value === null)
          callback(key);
      });
    })(keys[i]);
  }
}

// Initialize a storage variable to the provided value if it is not already set.
function define_storage_variable(key, value) {
  chrome.storage.local.get(key, function (items) {
    if (!(key in items)) {
      var item = {};
      item[key] = value;
      chrome.storage.local.set(item);
    }
  });
}
