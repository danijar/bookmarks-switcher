var sync = (function () {
  var public = {};
  var private = {};

  public.init = function (callback) {
    private.register();
    folder.init(function () {
      if (callback)
        callback();
    });
  };

  // Update the content of target to match the content of target. The current
  // naive implementation just clears the target folder and copied the whole
  // tree from source over every time.
  public.update_running = false;
  public.update = function (target, source, callback) {
   public.update_running = true;
   console.log('update', target, source);
    folder.clear(target, function () {
      folder.copy(source, target, function () {
        if (callback)
          callback();
        // Disable updating mode after all currently enqued callback ran
        setTimeout(function () {
          public.update_running = false;
        });
      });
    });
  };

  // Update the content of the active folder to match the content of the
  // bookmarks bar.
  public.update_active = function (callback) {
    storage.get('folder-bar', 'folder-active', function (bar, active) {
      public.update(active, bar, callback);
    });
  };

  // Update the content of the bookmarks bar to match the content of the active
  // folder.
  public.update_bar = function (callback) {
    storage.get('folder-bar', 'folder-active', function (bar, active) {
      public.update(bar, active, callback);
    });
  };

  private.handle_change = function (id) {
    // Do not listen to modifications triggered by this handler itself.
    if (public.update_running) {
      console.log('ignore event');
      return;
    }
    setTimeout(function () {
      storage.get('folder-bar', 'folder-active', function (bar, active) {
        folder.find_child(id, bar, function (in_bar) {
          if (in_bar) {
            public.update_active();
          } else {
            folder.find_child(id, active, function (in_active) {
              if (in_active) {
                public.update_bar();
              }
            });
          }
        });
      });
    }, 500);
  };

  // Register to the change events of the bookmarks tree.
  private.register = function () {
    chrome.bookmarks.onCreated.addListener(function (id, info) {
      private.handle_change(id);
    });
    chrome.bookmarks.onRemoved.addListener(function (id, info) {
      // storage.get('folder-active', function (active) {
        // if (active == id) {
          // Active folder was deleted, so find or create a new one
          // folder.init();
        // } else {
          private.handle_change(id);
        // }
      // });
    });
    chrome.bookmarks.onChanged.addListener(function (id, info) {
      private.handle_change(id);
    });
    chrome.bookmarks.onMoved.addListener(function (id, info) {
      // Moving out of the parent folder should be treated as deletion.
      private.handle_change(id);
    });
    chrome.bookmarks.onChildrenReordered.addListener(function (id, info) {
      private.handle_change(id);
    });
  };

  return public;
})();
