var init = (function () {
  var public = {};
  var private = {};

  // Detect the 'Bookmarks bar' and 'Other Bookmarks' folders and create and
  // select a new folder under other bookmarks to synchronize with the bookmarks
  // bar. If some of those steps already ran, they are skipped.
  public.init = function () {
    storage.clear();
    folder.init(function (bar, other, active) {
      console.log(bar, other, active);
      storage.log();
    });
  };

  return public;
})();

init.init();
