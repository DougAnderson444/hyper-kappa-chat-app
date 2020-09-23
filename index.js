const path = require("path");

// This is a dirty hack for browserify to work. 😅
if (!path.posix) path.posix = path;

var RAM = require("random-access-memory");
const RAI = require("random-access-idb");

var hyperswarm = require("hyperswarm");
var kappa = require("kappa-core");

const DEFAULT_APPLICATION_NAME = "kappaCore";

var isBrowser = process.title === "browser";

module.exports = SDKappa;

function SDKappa({
  storage,
  persist = true,
  applicationName = DEFAULT_APPLICATION_NAME,
} = {}) {
  // Derive storage if it isn't provided
  if (!storage) {
    if (persist !== false) {
      if (isBrowser) {
        // Get a random number, use it for random-access-application
        storage = RAI(applicationName); // + new Date(Date.now()).toLocaleString());
      } else {
        //nodejs
        storage = require("tmp").dirSync({ prefix: "kappaCore-" })
          .applicationName;
      }
    } else {
      // Nothing should be persisted. 🤷
      storage = RAM;
    }
  }

  var core = kappa(storage, { valueEncoding: "json"});

  return {
    core,
    hyperswarm
  };
}