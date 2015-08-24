var storage = (function () {
  var public = {};

  // Get the values of one of more storage variables passed as arguments to the
  // callback. If a key is not found, null will be passed for it instead.
  public.get = function () {
    var keys = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    keys = [].concat.apply([], keys);
    var callback = arguments[arguments.length - 1];
    chrome.storage.local.get(keys, function (items) {
      var values = [];
      for (var i = 0; i < keys.length; ++i)
        values.push(items[keys[i]] || null);
      callback.apply(null, values);
    });
  };

  // Set the value of an existing or new key in the storage.
  public.set = function (key, value, callback) {
    item = {};
    item[key] = value;
    chrome.storage.local.set(item, callback);
  };

  // Given one or more keys, the callback will be called on each key that
  // doesn't exist as a storage variable yet.
  public.not_exist = function () {
    var keys = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    keys = [].concat.apply([], keys);
    var callback = arguments[arguments.length - 1];
    for (var i = 0; i < keys.length; ++i) {
      (function (key) {
        public.get(key, function (value) {
          if (value === null)
            callback(key);
        });
      })(keys[i]);
    }
  };

  // Initialize a storage variable to the provided value if it is not already
  // set.
  public.define = function (key, value, callback) {
    chrome.storage.local.get(key, function (items) {
      if (!(key in items))
        public.set(key, value, callback);
    });
  };

  // Clear all entries in the storage.
  public.clear = function () {
    chrome.storage.local.clear();
  };

  // Log all key value pairs currently in the storage to the console.
  public.log = function (label) {
    label = label || 'Storage: ';
    chrome.storage.local.get(null, function (items) {
      console.log(label, items);
    });
  };

  return public;
})();

