# Vatom Spaces: Token Gating Plugin 🔌

This plugin is used for token gating inside of spaces (Experimental)

## Building the plugin
- Ensure you have [Node.js](https://nodejs.org) installed.
- Install dependencies: `npm install`
- Build the plugin: `npm run build`

## Developing locally
- Start the dev server: `npm start`
- Load the plugin in your space. Select Plugins, press the (+) icon and then paste the address: [http://localhost:9000/plugin.js](http://localhost:9000/plugin.js)
- After making code changes, refresh the page

> **Note:** You can only sideload plugins in a space you are the owner of.

## Using the plugin (Version 2)
- Open the tokens menu (via button on bottom bar)
- Create token/s (Only Vatom Network at the moment)
- Select type (NFT or Coin)
- Input the campaign ID + Object ID of the vatom smart NFT OR business IF for vatom coin.
- Can delete token if necessary, setting the fields to empty will prevent it from being used as well.
- Inputting a Zone ID will convert token to gate the given zone instead of the space.

**Note** Admins by design. Will bypass entry denial. A popup will be displayed to notify user of this. <br />
**Note** The API query takes a few seconds to return before granting or denying entrance to space.