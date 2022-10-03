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

## Using the plugin (Version 0.5)
- Open the tokens menu (via button on bottom bar)
- Create token/s
- Input fields to specify token rules
- Can delete token if/when necessary.
- Inputting a Zone ID will convert token to gate the given zone instead of the space.
- You can save and load your token rules via the buttons at the bottom of the panel.
- You can set general settings that apply to all token rules at the top of the panel.

**Note** Admins by design. Will bypass entry denial. A popup will be displayed to notify user of this. <br />
**Note** The API query might take few seconds to return before granting or denying entrance to space.