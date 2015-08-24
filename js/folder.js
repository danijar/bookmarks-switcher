var folder = (function () {
  var public = {};
  var private = {};

  // Finds the following folders and writes their ids to the storage. The active
  // folders is create if it cannot be found.
  //
  // folder-bar:    Id of the bookmarks bar folder
  // folder-other:  Id of the other bookmarks folder
  // folder-active: Id of the currently selected folder to sync with the
  //                bookmarks bar
  public.init = function (callback) {
    private.ensure_base(function (bar, other) {
      private.ensure_active(function (active) {
        callback(bar, other, active);
      });
    });
  };

  // Pass a boolean to the callback indicating whether the recursive contents of
  // both bookmarks folders are equal.
  public.compare = function (lhs, rhs, callback) {
    // Not implemented yet.
    callback(false);
  };

  // Try to find an equal folder to needle within the tree of container. The
  // folder will be passed to the callback or null if non was found.
  public.find_within = function (needle, container, callback) {
    chrome.bookmarks.getChildren(container.id, function (children) {
      // Not implemented yet.
      callback(null);
    });
  };

  // Find 'Bookmarks Bar' and 'Other Bookmarks' folders and store their ids into
  // the storage variables 'folder-bar' and 'folder-other' respectively. Don't
  // override those variables if they already exist.
  private.ensure_base = function (callback) {
    var root = '0';
    chrome.bookmarks.getChildren(root, function (children) {
      var bar = children[0];
      var other = children[1];
      storage.define('folder-bar', bar.id);
      storage.define('folder-other', other.id);
      callback(bar, other);
    });
  };

  // Try to find the active folder. In the easiest case, it can be found in the
  // 'folder-active' storage variable. Otherwise all folders under 'Other
  // bookmarks' will be compared to the bookmarks bar to find one with the same
  // content. Otherwise a default folder will be created.
  private.ensure_active = function (callback) {
    storage.get('folder-active', function (active) {
      if (active)
        return callback(active);
      // Try to find active folder based on content
      private.find_active(function (active) {
        if (active)
          storage.set('folder-active', active.id,
              function () { callback(active); });
        else
          private.create_active(callback);
      });
    });
  };

  // Compare the contents of each folder unter 'Other bookmarks' with 'Bookmarks
  // bar'. Pass the folder to the provided callback or null if not found.
  private.find_active = function (callback) {
    storage.get('folder-bar', 'folder-other', function (bar, other) {
      chrome.bookmarks.get([bar, other], function (bookmarks) {
        var bar = bookmarks[0];
        var other = bookmarks[1];
        public.find_within(bar, other, callback);
      });
    });
  };

  // Create the initial folder to synchronize the bookmarks bar with. It's
  // called 'Default bookmarks bar' and lives directly under 'Other bookmarks'.
  private.create_active = function (callback) {
    storage.get('folder-other', function (other) {
      chrome.bookmarks.create({
        parentId: other,
        title: 'Default bookmarks bar'
      }, function (active) {
        storage.set('folder-active', active.id,
            function () { callback(active); });
      });
    });
  };

  return public;
})();

