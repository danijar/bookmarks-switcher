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

  // Remove the content of the folder given as id.
  public.clear = function (folder, callback) {
    // Recursively iterate over a list of nodes to delete them.
    function recursive(nodes, index, callback) {
      if (index >= nodes.length) {
        callback();
        return;
      }
      chrome.bookmarks.removeTree(nodes[index].id, function () {
        recursive(nodes, index + 1, callback);
      });
    }
    // Fetch children to delete them with the helper defined above
    chrome.bookmarks.getChildren(folder, function (children) {
      recursive(children, 0, callback);
    });
  };

  private.clone = function (bookmark, parent_id) {
    return {
      parentId: parent_id,
      title: bookmark.title,
      url: bookmark.url || null
    };
  };

  // Copy the content structure of source to dest, both given as ids.
  public.copy = function (source, dest, callback) {
    // Recursively copy over the tree structure
    var queue = [];
    function recursive() {
      // Call user callback when breadth first search finished
      if (!queue.length) {
        callback();
        return;
      }
      // Pop next node to visit
      var pair = queue.shift();
      var source = pair[0], dest = pair[1];
      // Copy current children
      source.children.forEach(function (child) {
        var properties = private.clone(child, dest.id);
        chrome.bookmarks.create(properties, function (clone) {
          // Enqueue folders to visit later
          if (!('url' in clone))
            queue.push([child, clone]);
          recursive();
        });
      });
    }
    // Query and start with source and destination roots
    chrome.bookmarks.getSubTree(source, function (source_tree) {
      chrome.bookmarks.get(dest, function (dest_root) {
        queue = [[source_tree[0], dest_root[0]]];
        recursive();
      });
    });
  };

  // Comparator to sort lists of bookmark nodes first by folder or bookmark,
  // then by title. Bookmarks with the same title are sorted by url. Folders
  // with the same title are sorted by number of children.
  private.bookmark_comparator = function (lhs, rhs) {
    if ('url' in lhs !== 'url' in rhs)
      return 'url' in lhs ? -1 : 1;
    if (lhs.title != rhs.title)
      return lhs.title < rhs.title ? -1 : 1;
    if ('url' in lhs && lhs.url != rhs.url)
      return lhs.url < rhs.url ? -1 : 1;
    if ('children' in lhs && lhs.children.length != rhs.children.length)
      return lhs.children.length < rhs.children.length ? -1 : 1;
    return 0;
  };

  // Compare two bookmark trees and return a boolean indicating if the contained
  // folders and bookmarks have the same titles and urls.
  public.compare = function (lhs_tree, rhs_tree, callback) {
    // Breadth first search of both trees
    var queue = [[lhs_tree, rhs_tree]];
    while (queue.length) {
      var pair = queue.shift();
      var lhs = pair[0];
      var rhs = pair[1];
      var one_is_node = 'url' in lhs || 'url' in rhs;
      // Compare current pair of nodes
      if (lhs.title !== rhs.title && lhs.id !== lhs_tree.id)
        return false;
      if (one_is_node && (lhs.url || null) !== (rhs.url || null))
        return false;
      if (one_is_node && (lhs.url || null) === (rhs.url || null))
        continue;
      if (lhs.children.length !== rhs.children.length)
        return false;
      // If both are folders, we must traverse their content
      var lhs_children = lhs.children.slice();
      var rhs_children = rhs.children.slice();
      lhs_children = lhs_children.sort(private.bookmark_comparator);
      rhs_children = rhs_children.sort(private.bookmark_comparator);
      lhs_children.forEach(function (child, index) {
        queue.push([child, rhs_children[index]]);
      });
    }
    return true;
  };

  // Try to find a sub tree inside container that is equal to the target tree.
  // The folder that is equivalent to the target will be passed to the callback
  // or null if not found.
  public.find_within = function (target_id, container_id, callback) {
    chrome.bookmarks.getSubTree(target_id, function (target_tree) {
      chrome.bookmarks.getSubTree(container_id, function (container_tree) {
        var target = target_tree[0];
        var found = null;
        // Breadth first search in the container
        var queue = container_tree[0].children;
        while (queue.length) {
          var current = queue.shift();
          if (public.compare(target, current)) {
            found = current;
            break;
          }
          queue.push.apply(queue, current.children);
        }
        callback(found);
      });
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
        if (active) {
          storage.set('folder-active', active.id,
              function () { callback(active); });
          console.log('Found existing active folder', active.title);
        } else {
          private.create_active(callback);
          console.log('Created initial active folder');
        }
      });
    });
  };

  // Compare the contents of each folder unter 'Other bookmarks' with 'Bookmarks
  // bar'. Pass the folder to the provided callback or null if not found.
  private.find_active = function (callback) {
    storage.get('folder-bar', 'folder-other', function (bar, other) {
      public.find_within(bar, other, callback);
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
        sync.force();
      });
    });
  };

  return public;
})();

