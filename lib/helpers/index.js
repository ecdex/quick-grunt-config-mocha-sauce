var fs = require("fs"),
    fsPath = require("path"),
    _ = require("lodash"),
    crypto = require("crypto"),
    inProductionLikeEnvironment,
    hbs,
    helpers;


// default, can be over-ridden by user
inProductionLikeEnvironment = function () {
  return process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test";
};

function initializeHelpers(systemsHandlebars, iPLE) {
  if (iPLE) {
    inProductionLikeEnvironment = function () { return iPLE; };
  }

  hbs = systemsHandlebars;
  helpers.registerHelpers();

  return helpers;
}

helpers = {
  installResourceLoadingErrorCheckFunctions: function () {
    if (inProductionLikeEnvironment()) {
      return "";
    }

    return new hbs.SafeString([
      "<script type=\"text/javascript\">",
      "  resourcesWeShouldHaveLoaded = {};",

      "  function loadingCss(nickname) {",
      "    resourcesWeShouldHaveLoaded[nickname] = false;",
      "    var el = document.getElementById(nickname + '-load');",
      "    el.onload = function () { resourcesWeShouldHaveLoaded[nickname] = 'loaded'; };",
      "  }",

        // technique of appending a script element that's marked sync from
        // http://www.html5rocks.com/en/tutorials/speed/script-loading/
      "  function loadingJs(nickname, url) {",
      "    resourcesWeShouldHaveLoaded[nickname] = false;",
      "    var script = document.createElement('script');",
      "    script.id = nickname + '-load';",
      "    script.src = url;",
      "    script.onload = function () { resourcesWeShouldHaveLoaded[nickname] = 'loaded'; };",
      "    script.async = false;",
      "    document.head.appendChild(script);",
      "  }",
      "</script>"
    ].join(""));
  },

  hashOfAssetFile: function (path, filesystem) {
    if (!process.env.NODE_SERVER_FILES_ROOT ||
        process.env.NODE_SERVER_FILES_ROOT === "" ||
        !path || !path.length) {
      return new hbs.SafeString("");
    }

    var filesRoot = process.env.NODE_SERVER_FILES_ROOT,
        hasher = crypto.createHash("md5"),
        fullPath;
    fullPath = filesystem ? path : fsPath.join(filesRoot, path);

    try {
      var content = fs.readFileSync(fullPath);
      hasher.update(content);
      return new hbs.SafeString(hasher.digest("hex"));
    } catch (e) {
      console.error("Couldn't generate hash for: '" + fullPath + "'");
      return new hbs.SafeString("");
    }
  },

  assetLoadPath: function (options) {
    var path = options.hash.production_path;
    if (path.indexOf("http") === 0) {
      return path;
    } else {
      var safeCacheBuster = helpers.cacheBuster(path),
          cacheBuster = safeCacheBuster.toHTML();
      return path + "?version=" + cacheBuster;
    }
  },

  loadCss: function (nickname, options) {
    if (inProductionLikeEnvironment()) {
      return new hbs.SafeString("<link rel=\"stylesheet\" href=\"" + helpers.assetLoadPath(options) + "\">");
    } else {
      return new hbs.SafeString([
        "<link rel=\"stylesheet\" id=\"" + nickname + "-load\" href=\"" + options.hash.development_path + "\">",
        "<script type=\"text/javascript\">loadingCss('" + nickname + "');</script>"
      ].join(""));
    }
  },

  loadJs: function (nickname, options) {
    if (inProductionLikeEnvironment()) {
      return new hbs.SafeString("<script src=\"" + helpers.assetLoadPath(options) + "\"></script>");
    } else {
      return new hbs.SafeString(
        "<script type=\"text/javascript\">loadingJs('" + nickname + "', '" + options.hash.development_path + "');</script>"
      );
    }
  },

  performResourceLoadingErrorCheck: function () {
    if (inProductionLikeEnvironment()) {
      return "";
    }

    return new hbs.SafeString([
      "<script type=\"text/javascript\">",
      "  function performResourceLoadingErrorCheck() {",
      "    for (var key in resourcesWeShouldHaveLoaded) {",
      "      if (resourcesWeShouldHaveLoaded.hasOwnProperty(key) &&",
      "          resourcesWeShouldHaveLoaded[key] !== 'loaded') {",
      "        console.log(\"Error: didn't load asset nicknamed '\" + key + \"' by completion of page load.  Something is probably wrong.\");",
      "      }",
      "    }",
      "  }",
      "  window.addEventListener('load', performResourceLoadingErrorCheck);",
      "</script>"
    ].join(""));
  },

  registerHelpers: function () {
    var keys = _.difference(_.keys(helpers), ["registerHelpers"]);
    _.each(keys, function (key) {
      hbs.registerHelper(key, helpers[key]);
    });
  }
};

helpers.cacheBuster = helpers.hashOfAssetFile;  // default
module.exports = initializeHelpers;
