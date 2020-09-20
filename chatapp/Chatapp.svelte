<script>
  var multifeed = require("multifeed");

  var RAM = require("random-access-memory");
  const RAI = require("random-access-idb");

  var hyperswarm = require("hyperswarm");
  var crypto = require("crypto");
  var kappa = require("kappa-core");
  var memdb = require("level-mem");
  var list = require("kappa-view-list");
  var pump = require("pump");
  const delay = require("delay");

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

  var timestampView = list(memdb(), function(msg, next) {
    if (msg.value.timestamp && typeof msg.value.timestamp === "string") {
      // sort on the 'timestamp' field
      next(null, [msg.value.timestamp]);
    } else {
      next();
    }
  });

  async function main() {
    const storage = getNewStorage();

    var multi = multifeed(storage, { valueEncoding: "json" }); // too many calls
    // if you make you own multifeed, you have access to it's events, like on feed:
    multi.on("feed", function(feed, num) {
      //output += `<br/>Added feed: ${num} / ${feed.key.toString("hex")}`;
    });

    const kappaOpts = { valueEncoding: "json", multifeed: multi };
    var core = kappa(null, kappaOpts);
    core.use("chats", timestampView);

    core.ready("chats", () => {
      // wait until core writer is ready before connecting to swarm
      core.writer("local", function(err, f) {
        if (err) console.error(err);
        feed = f;
        // swarm logic
        const topicHex = crypto
          .createHash("sha256")
          .update("our-topic")
          .digest();
        startSwarm(topicHex);
        watchTail(); // listen for updates to the lastest messages
        readTail(10); // initial read, since tail only triggers on new append()
      });
    });

    function readTail(number) {
      // Print the last saved entries
      core.api.chats.read({ limit: number, reverse: true }, function(
        err,
        msgs
      ) {
        if (err) console.error(err);
        if (msgs.length > 0) {
          for (var i = msgs.length - 1; i >= 0; i--) {
            output += `<br/>${msgs[i].value.timestamp} - ${msgs[i].value.nickname}: ${msgs[i].value.text}`;
          }
        }
      });
    }
    function watchTail() {
      core.api.chats.tail(10, function(msgs) {
        // output = ""; //only show the lastest messages
        output += `<br/>----------TAIL-----------------`;
        msgs.forEach(function(msg, i) {
          output += `<br/>${msg.value.timestamp} - ${msg.value.nickname}: ${msg.value.text}`;
        });
      });
    }

    function startSwarm(topic) {
      var swarm = hyperswarm();
      output += `<br/>topic: ${topic.toString("hex")}`;

      swarm.join(topic, {
        lookup: true, // find & connect to peers
        announce: true // optional- announce self as a connection target
      });
      swarm.on("connection", function(connection, info) {
        output += `<br/>New peer connected!`;

        const stream = core.replicate(info.client, { live: true });
        stream.on("remote-feeds", function() {
          // output += `<br/>remote-feeds fired. Refreshing tail.`;
          // too soon, view not ready yet?
          // how do I tell when the view has loade all these new feeds?
          // using a new view does nothing except duplicate
        });

        pump(connection, stream, connection);
      });
    }
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
