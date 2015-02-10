var path = require("path");

function loadTestTasks(grunt, settings) {
  settings = settings || {};
  settings.testFileGlobs = settings.testFileGlobs || {};

  var mochacli = {},
      environments = {},
      testTypes = settings.testTypes || ["unit", "integration"];

  _.each(testTypes, function (key) {
    var globs = []
        .concat([
          path.join(pathToThisFile, "lib", key, "**", "*_globals.js"),
          path.join("test", key, "**", "*_globals.js")
        ])
        .concat(_.map(settings.testFileGlobs.common || [], function (glob) {
          return path.join("test", key, glob);
        }))
        .concat(settings.testFileGlobs[key] || [])
        .concat([
          path.join(pathToThisFile, "lib", key, "**", "*_helpers.js"),
          path.join("test", key, "**", "*_helpers.js"),
          path.join("test", key, "**", "*_spec.js")
        ]);

    mochacli[key] = { options: { filesRaw: globs}};
  });

  return {
    mochacli: mochacli,

    env: {
      local: { INTEGRATION_CLIENTS_LOCATION: "local" },
      sauce: {
        INTEGRATION_CLIENTS_LOCATION: "sauce",
        multi: "spec=- mocha-sauce-notifying-reporter=-"
      }
    },

    environmental: {
      options: {
        inject: environments
      }
    }
  };
}

module.exports = loadTestTasks;
