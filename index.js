var path = require("path"),
    _ = require("lodash"),
    glob = require("glob");

function loadTestTasks(grunt, settings) {
  settings = settings || {};
  settings.testFileGlobs = settings.testFileGlobs || {};

  var mochacli = {},
      testTypes = settings.testTypes || ["unit", "integration"],
      integrationNickname = settings.integrationNickname || "server",
      browserNames = settings.browserNames || ["phantomjs", "chrome", "firefox"],
      integrationTargets = settings.integrationTargets || ["server"],
      integrationEnvironments = settings.integrationEnvironments || {};
  // top-level tasks
  grunt.registerTask("integrate", "run automated integration tests (local and via Sauce Labs",
      ["integrate-local", "integrate-sauce"]
  );

  grunt.registerTask("test-unit", "run automated unit tests (mocha)",
      ["environmental:test", "mochacli:unit"]);


  // tasks to run integration tests; no explicit browser selection
  // used by the default "test" task, and therefore by CI
  var taskList = [];
  _.each(integrationTargets, function (target) {
    var taskName = "test-integration-" + target;
    taskList.push(taskName);
    grunt.registerTask(taskName,
        "run automated integration tests (locally, default live browser) for '" + target + "'",
        [
          "environmental:test:" + target,
          "env:local",
          "express:test-" + target,
          "mochacli:integration",
          "express:test-" + target + ":stop"
        ]);
  });

  grunt.registerTask("test-integration",
      "run automated integration tests (local, default live browser)", taskList);

  _.each(testTypes, function (key) {
    var globs = []
        .concat([
          path.join(__dirname, "lib", key, "**", "*_globals.js"),
          path.join("test", key, "**", "*_globals.js")
        ])
        .concat(_.map(settings.testFileGlobs.common || [], function (fileGlob) {
          return path.join("test", key, fileGlob);
        }))
        .concat(settings.testFileGlobs[key] || [])
        .concat([
          path.join(__dirname, "lib", key, "**", "*_helpers.js"),
          path.join("test", key, "**", "*_helpers.js"),
          path.join("test", key, "**", "*_spec.js")
        ]);

    // mocha throws an error if it is given a glob that doesn't match at least
    // one file, so pre-filter all of these possible glob patterns to exclude ones
    // that don't produce files
    globs = _.reject(globs, function (fileGlob) {
      var files = glob.sync(fileGlob);
      return files.length === 0;
    });

    mochacli[key] = { options: { filesRaw: globs } };
  });


  var description = "run integration tests, server and middleware, sequentially for each local browser config",
      crossProduct = [];

  _.each(integrationTargets, function (target) {
    _.each(browserNames, function (browserName) {
      var environmentName = target + "-" + browserName,
          taskName = "integrate-" + environmentName;

      crossProduct.push(taskName);
      integrationEnvironments[environmentName] = _.merge(
          { INTEGRATION_BROWSERNAME: browserName },
          integrationEnvironments[target] || {
            INTEGRATION_ROOT: "/"
          }
      );

      grunt.registerTask(taskName,
          "run integration tests for " + target + " in " + browserName,
          [
            "environmental:test:" + environmentName,
            "env:local",
            "express:test-" + target,
            "mochacli:integration",
            "express:test-" + target + ":stop"
          ]
      );
    });
  });
  grunt.registerTask("integrate-local", description, crossProduct);

  grunt.registerTask(
      "integrate-sauce",
      "run integration tests on " + integrationNickname + " config via remote browsers at Sauce Labs",
      function () {
        var configString,
            sauceConfigs = require("./.sauce-configs.js"),
            focusString = process.env.INTEGRATION_FOCUS,
            focusRe = focusString ? new RegExp(focusString) : null;

        grunt.task.run(
            "express:test-" + integrationNickname,
            "environmental:test:" + integrationNickname,
            "env:sauce"
        );

        _.each(_.keys(sauceConfigs), function (browserName) {
          _.each(sauceConfigs[browserName], function (configHash) {
            configHash.browserName = browserName;
            configString = JSON.stringify(configHash);

            if (!focusRe || focusRe.test(configString)) {
              grunt.task.run(
                  "set-sauce-config:" + configString.replace(/:/g, "\\x3A"),
                  "mochacli:integration"
              );
            }
          });
        });

        grunt.task.run("express:test-" + integrationNickname + ":stop");
      });


  grunt.registerTask(
      "set-sauce-config",
      "put the task's target (assumed to be a JSON string) into the environment variable SAUCE_CONFIG_JSON",
      function (target) {
        process.env.SAUCE_CONFIG_JSON = target;
      }
  );

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
        inject: integrationEnvironments
      }
    }
  };
}

module.exports = loadTestTasks;
