# Vatom Spaces: Example React Plugin 🔌

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

## Using the plugin (Version 0)
- Open the plugin menu
- Find the token gating plugin (which should be sideloaded)
- Open settings panel
- Input the relevant details (Vatom ID is mandatory)

**Note** Currently only able to use Vatom ID. However, other fields will speed up API query.
**Note** Admins by design. Will bypass entry denial. A popup will be displayed to notify user of this.