// Uses storage keys:
//
// folder-bar:    Id of the bookmarks bar folder
// folder-other:  Id of the other bookmarks folder
// folder-active: Id of the currently selected folder to sync with the
//                bookmarks bar

// Detect the 'Bookmarks bar' and 'Other Bookmarks' folders and create and
// select a new folder under other bookmarks to synchronize with the bookmarks
// bar. If some of those steps already ran, they are skipped.
function initialize() {
  chrome.storage.local.clear();
  chrome.storage.local.get(null, function (items) {
    console.log('Storage: ', items);
  });
  ensure_base_folders();
  ensure_active_folder();
  setTimeout(function () {
    chrome.storage.local.get(null, function (items) {
      console.log('Storage: ', items);
    });
  }, 1000);
}

// Get the values of one of more storage variables passed as arguments to the
// callback. If a key is not found, null will be passed for it instead.
function storage_get() {
  var keys = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  console.log(keys);
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

// Finds 'Bookmarks Bar' and 'Other Bookmarks' folders and stores their ids into
// the storage variables 'folder-bar' and 'folder-other' respectively. Those
// variables will not be overwritten if they already exist.
function ensure_base_folders() {
  var root = '0';
  chrome.bookmarks.getChildren(root, function (children) {
    define_storage_variable('folder-bar', children[0].id);
    define_storage_variable('folder-other', children[1].id);
  });
}

function ensure_active_folder() {
  storage_not_exist('folder-active', function(key) {
    console.log(key, 'does not exist');
    // Try to find active folder based on content
    // ...
    // Create new folder under other bookmarks
    // ...
    // Set it as active folder
    // ...
  });
}

initialize();

