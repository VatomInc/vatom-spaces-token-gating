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

## Using the plugin (Version 1)
- Open the tokens menu (via button on bottom bar)
- Create token/s
- Input the vatom ID of the vatom you wish to tokenize (Mandatory)
- Input the other fields if you'd like (Optional) it should speed up the API request time
- Can delete token if necessary, setting the Vatom ID to empty will prevent it from being used as well.

**Note** Admins by design. Will bypass entry denial. A popup will be displayed to notify user of this. <br />
**Note** The API query takes a few seconds to return before granting or denying entrance to space.