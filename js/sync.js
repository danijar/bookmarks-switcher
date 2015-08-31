var sync = (function () {
  var public = {};

  public.force = function (callback) {
    storage.get('folder-bar', 'folder-active', function (bar, active) {
      folder.clear(active, function () {
        folder.copy(bar, active, function () {
          if (callback)
            callback();
        });
      });
    });
  };

  return public;
})();
