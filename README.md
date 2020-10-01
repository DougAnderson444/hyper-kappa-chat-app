# Hyper Kappa Chat App

Repo to build a kappa bundle that works in the browser.

A working chat app built on kappa-core, multifeed, and hypercore. Browser user experience is done through Svelte.

## How use this?

Clone this repo, and run

`npm run build-chat-example`

and it should pop up in the browser.

Open another browser to test it out.

TODO

 - [x] Hydratable into the DOM via `id="hyper-kappa-chat-app"`
 - [ ] Dynamic topic
 - [ ] WebRTC checks (currently need to refresh sometimes?)
 - [ ] Multiple same domains open without breaking...
 - [x] Fix load feed if local db was cleared
 - [x] Fix kappa load of missed messages