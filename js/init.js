var init = (function () {
  var public = {};
  var private = {};

  private.register = function () {
    chrome.bookmarks.onCreated.addListener(function (id, info) {
      // console.log('onCreated', id, info);
    });
    chrome.bookmarks.onRemoved.addListener(function (id, info) {
      // console.log('onRemoved', id, info);
    });
    chrome.bookmarks.onChanged.addListener(function (id, info) {
      // console.log('onChanged', id, info);
    });
    chrome.bookmarks.onMoved.addListener(function (id, info) {
      // console.log('onMoved', id, info);
    });
    chrome.bookmarks.onChildrenReordered.addListener(function (id, info) {
      // console.log('onChildrenReorderd', id, info);
    });
  };

  // Detect the 'Bookmarks bar' and 'Other Bookmarks' folders and create and
  // select a new folder under other bookmarks to synchronize with the bookmarks
  // bar. If some of those steps already ran, they are skipped.
  public.init = function () {
    storage.clear();
    folder.init(function (bar, other, active) {
      private.register();
      storage.log();
    });
  };

  return public;
})();

init.init();
