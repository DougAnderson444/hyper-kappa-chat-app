// this script gets bundled by Browserify into bundle.js and included in index.html
const App = require("./Chatapp.svelte");

const app = new App({
  target: document.getElementById('hyper-kappa-chat-app'), // document.querySelector("#hyper-kappa-chat-app"), // document.body, //  // 
  props: {
    name: "world",
  },
  hydrate: true,
});
