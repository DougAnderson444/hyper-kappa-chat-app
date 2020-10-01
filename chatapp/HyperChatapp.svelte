<script>
  /*
    Using hypermultifeed, which uses corestore and networker
  */
  const hcrypto = require("hypercore-crypto");
  var crypto = require("crypto");

  const Corestore = require("corestore");
  const SwarmNetworker = require("@corestore/networker");

  const Multifeed = require("hypermultifeed");
  const MultifeedNetworker = require("hypermultifeed/networker");

  var kappa = require("kappa-core");
  var list = require("kappa-view-list");
  var memdb = require("level-mem");

  var RAM = require("random-access-memory");
  var RAW = require("random-access-web");
  const RAI = require("@DougAnderson444/random-access-idb");

  import { onMount } from "svelte";

  let first = [
    "Super",
    "Awesome",
    "Fantastic",
    "Amazing",
    "Wonder",
    "Boss",
    "Fab",
    "Foo",
    "Super",
    "Awesome"
  ];
  let last = [
    "Hero",
    "Warlord",
    "Frolock",
    "Dude",
    "Human",
    "Darling",
    "Love",
    "Bar",
    "Dude",
    "Human"
  ];

  let nickname =
    first[Math.floor(Math.random() * 10)] +
    "-" +
    last[Math.floor(Math.random() * 10)];

  let output = "";
  let textIn;
  var feed;
  var isBrowser;
  var pristine = false;

  onMount(async () => {
    // This will run your code
    isBrowser = process.title === "browser";
    main();
  });

  function getNewStorage() {
    if (isBrowser) {
      // Get a random number, use it for random-access-application
      const name = "hyperChat"; // + new Date(Date.now()).toLocaleString();
      //return RAA(name);
      return RAI(name);
    } else {
      return require("tmp").dirSync({
        prefix: "hyperchat-"
      }).name;
    }
  }

  async function main() {
    const storage = getNewStorage();
    const store = new Corestore(storage);

    const swarmOpts = {}; // queue: { multiplex: true } // already done in networker for us // bootstrap: false
    const swarmNetworker = new SwarmNetworker(store, swarmOpts);
    var network = new MultifeedNetworker(swarmNetworker); // multi + network = swarm

    const seedPhrase = "our-topic";
    const seed = crypto
      .createHash("sha256")
      .update(seedPhrase)
      .digest(); // seed needs to be 32 bytes
    const rootKey = hcrypto.keyPair(seed).publicKey; //topic is Ed25519 public key see: https://libsodium.gitbook.io/doc/public-key_cryptography/public-key_signatures

    console.log("rootKey: ", rootKey.toString("hex"));
    console.log(
      "topic: ",
      hcrypto.discoveryKey(Buffer.from(rootKey, "hex")).toString("hex")
    );
    var multi = new Multifeed(store, { rootKey, valueEncoding: "json" });

    // if you make you own multifeed, you have access to it's events, like on feed:
    multi.on("feed", function(feed, label) {
      output += `<br/>Added feed: ${label} / ${feed.key.toString("hex")}`;
    });

    network.swarm(multi);
    network.networker.on("peer-add", peer => {
      console.log("New peer added!"); //peer.remotePublicKey.toString("hex")
    });

    /**
     * KAPPA VIEWS of the multifeed
     */

    var timestampView = list(memdb(), function(msg, next) {
      if (msg.value.timestamp && typeof msg.value.timestamp === "string") {
        // sort on the 'timestamp' field
        next(null, [msg.value.timestamp]);
      } else {
        next();
      }
    });

    var core = kappa(store, { multifeed: multi }); // store not used since we pass in a multifeed
    core.use("chats", timestampView);

    core.ready("chats", () => {
      console.log(`chats ready`);
      core.writer("kappa-local", function(err, f) {
        if (err) console.error(err);

        console.log(`chats api ready`);
        feed = f; // make global

        f.ready(() => {
          console.log(`loca writer feed ready`);

          core.api.chats.tail(5, function(msgs) {
            output += `<br/> ----------TAIL----------------- `;
            msgs.forEach(function(msg, i) {
              output += `<br/>${msgs[i].value.timestamp} - ${msgs[i].value.nickname}: ${msgs[i].value.text}`;
            });
          });
        });
      });
    });
  }

  function doWrite(feed, data) {
    feed.append({
      type: "chat-message",
      nickname,
      text: data.toString().trim(),
      timestamp: new Date().toISOString()
    });
  }

  const handleSubmit = () => {
    doWrite(feed, textIn);
    textIn = "";
  };
</script>

<style>
  div.output {
    border: 1px solid salmon;
    padding: 1em;
    margin: 1em;
  }
  .form {
    border: 1px solid green;
    padding: 1em;
    margin: 1em;
  }
</style>

<main>
  <br />
  <div class="output">
    Output
    <br />
    {@html output}
  </div>
  <div>
    <form class="form" on:submit|preventDefault={handleSubmit}>
      Chat:
      <br />
      <input type="text" bind:value={textIn} />
    </form>
  </div>
</main>
