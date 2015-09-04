var init = (function () {
  var public = {};
  var private = {};

  public.init = function () {
    storage.clear();
    sync.init(function () {
      storage.log();
    });
  };

  return public;
})();

init.init();
