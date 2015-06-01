# quick-grunt-config-mocha-sauce
Module containing a generator for configurations for Grunt tasks for running tests using mocha, selenium-webdriver, and Sauce Labs.

Configurations are generated for unit tests (which can be used even if you don't
use the other options supported), in-browser integration tests run locally
using the selenium-webdriver NPM, and integration tests run in the cloud on
Sauce Labs via the sauce NPM.

[![NPM version](http://badge.fury.io/js/quick-grunt-config-mocha-sauce.png)](https://npmjs.org/package/quick-grunt-config-mocha-sauce "View this project on NPM")
[![Dependency Status](https://david-dm.org/ecdex/quick-grunt-config-mocha-sauce.png?theme=shields.io)](https://david-dm.org/ecdex/quick-grunt-config-mocha-sauce)
[![Development Dependency Status](https://david-dm.org/ecdex/quick-grunt-config-mocha-sauce/dev-status.png?theme=shields.io)](https://david-dm.org/ecdex/quick-grunt-config-mocha-sauce#info=devDependencies)
[![Peer Dependency Status](https://david-dm.org/ecdex/quick-grunt-config-mocha-sauce/peer-status.png?theme=shields.io)](https://david-dm.org/ecdex/quick-grunt-config-mocha-sauce#info=peerDependencies)

To use, list this package along with whichever of the following

you want to use in your project.
Require the other grunt plugin packages that you'll be using from your Gruntfile.js
normally (individually or via matchdep).  Requiring this module returns
a function with the following signature:

`configurationHash = makeConfig(grunt, settingsHash)`

You can also reuse the following configuration files for your project by
creating symbolic links to the versions under `node_modules/quick-grunt-config-mocha-sauce`:
* .sauce-configs.js
* lib/mocha.opts


This module registers and creates the configuration for a complete set of
Grunt tasks for each "test type" that you want to use.  The default test
types are "unit" and "integration", but this can be over-ridden by including
an array of test type names in the optional `settings` argument hash under
the key `testTypes`.  To duplicate the default behavior, you would invoke
quick-grunt-config-mocha-sauce like this:

```JavaScript
function configureGrunt(grunt) {
  var configuration = {},
      settings = {
    testTypes: ["unit", "integration"]
  };
  _.merge(configuration, require("quick-grunt-config-mocha-sauce")(grunt, settings));

  // other stuff

  grunt.initConfig(configuration);
}
```

The set of file globs that are put into the `mochacli` configuration hash
entries created by this module for each test type are as follows, and in
the following order:
* `lib/TYPE/**/*_globals.js` from quick-grunt-config-mocha-sauce
* `test/TYPE/**/*_globals.js` from your project
* for each string in `settings.testFileGlobs.common` (if present):
    * `test/TYPE/STRING` from your project
* any/all glob strings in the array `settings.testFileGlobs.TYPE`
* `lib/TYPE/**/*_helpers.js` from quick-grunt-config-mocha-sauce
* `test/TYPE/**/*_helpers.js` from your project
* `test/TYPE/**/*_spec.js` from your project

This order is intended to allow you to use the global functions and helper
modules defined in quick-grunt-config-mocha-sauce in conjunction with
any of your own, plus of course, specs.  And ensures that all the
`*_globals.js` files are loaded by Mocha first, so that their content
is available to all of the other files.





Contributions and suggestions are welcome, including a set of unit tests
covering the existing behavior.  Currently, running `grunt` in this
directory loads and executes the tasks defined by the NPM
[quick-grunt-config-coding-conventions](https://github.com/ecdex/quick-grunt-config-coding-conventions).
Please ensure that any changes you make continue to pass these checks.

Right now the "reference user" for this module is
[https://github.com/ecdex/tsme.git](https://github.com/ecdex/tsme.git).
Running 'grunt' in that
repository after installing your modified version of this module should
run clean, and should correctly find errors you introduce in JavaScript
files in the 'app' and 'build_components' directories.

If you make/propose changes that are incompatible with this module's invokation
in ecdex/tsme, please make a matching pull request against that repository.

If you want to introduce unit tests for this module, please introduce a
set of development dependencies that are a subset of those in ecdex/tsme.

Wanted:
* configuration options to control the name assumed for the test
directory in the host project (default to "test"), and the suffix of
individual test files we look for in those directories (default to "spec").
* some configuration option to replace the hard-coded assumption that
there is an "integration" entry in `settings.testTypes` and that the
files and Mocha tests for that test type are the ones to be used by
the `integrate-sauce` Grunt task we register.
* a configuration mechanism for people who don't want to use
`grunt-environmental`.
