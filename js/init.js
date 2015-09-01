var init = (function () {
  var public = {};
  var private = {};

  public.init = function () {
    storage.clear();
    folder.init(function (bar, other, active) {
      storage.log();
      sync.init();
    });
  };

  return public;
})();

init.init();
