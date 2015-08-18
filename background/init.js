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

initialize();

// Find 'Bookmarks Bar' and 'Other Bookmarks' folders and store their ids into
// the storage variables 'folder-bar' and 'folder-other' respectively. Don't
// override those variables if they already exist.
function ensure_base_folders(callback) {
  var root = '0';
  chrome.bookmarks.getChildren(root, function (children) {
    var bar = children[0].id;
    var other = children[1].id;
    define_storage_variable('folder-bar', bar);
    define_storage_variable('folder-other', other);
    callback(bar, other);
  });
}

// Try to find the active folder. In the easiest case, it can be found in the
// 'folder-active' storage variable. Otherwise all folders under 'Other
// bookmarks' will be compared to the bookmarks bar to find one with the same
// content. Otherwise a default folder will be created.
function ensure_active_folder(callback) {
  storage_get('folder-active', function(active) {
    if (active) {
      callback(active);
    } else {
      // Try to find active folder based on content
      try_find_active_folder(function (active) {
        if (active) {
          chrome.storage.local.set({'folder-active': active});
          callback(active);
        } else {
          // Create new folder under other bookmarks
          create_default_active_folder(function (folder) {
            callback(folder.id);
          });
        }
      });
    }
  });
}

// Compare the contents of each folder unter 'Other bookmarks' with 'Bookmarks
// bar'. Pass the id of the folder to the provided callback or null if not
// found.
function try_find_active_folder(callback) {
  var found = false;
  storage_get('folder-bar', 'folder-other', function (bar, other) {
    chrome.bookmarks.get([bar, other], function (bookmarks) {
      var bar = bookmarks[0];
      var other = bookmarks[1];
      other.children.forEach(function (child) {
        if (compare_folders(bar, child)) {
          found = true;
          callback(child.id);
        }
      });
    });
  });
  if (!found)
    callback(null);
}

// Create the initial folder to synchronize the bookmarks bar with. It's called
// 'Default bookmarks bar' and lives directly under 'Other bookmarks'.
function create_default_active_folder(callback) {
  storage_get('folder-other', function (other) {
    chrome.bookmarks.create({
      parendId: other,
      title: 'Default bookmarks bar'
    }, function (active) {
      chrome.storage.local.set({'folder-active': active.id});
      callback(active);
    });
  });
}
