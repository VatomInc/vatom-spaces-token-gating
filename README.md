# Vatom Spaces: Token Gating Plugin 🔌

This plugin is used for token gating inside of spaces (Experimental)

## Building the plugin
- Clone this repo on your device
- Open the clone repo (Through terminal or IDE such as visual studio code)
- Ensure you have [Node.js](https://nodejs.org) installed.
- Install dependencies: `npm install`
- Build the plugin: `npm run build`

## Installing the plugin
- Once you have built the plugin, a new folder will be created called 'dist'
- Enter your space
- Open Storage
- Create a folder for the plugin (NB there must be folder name MUST be one word e.g. TokenGating or token-gating)
- Add the contents of the 'dist' folder to the folder you just created (NB! All files MUST be included in the same way they are shown in the dist folder)
- Once all files are added (Including the ui-build/panel folder) Click on Plugin.js and copy URL
- Open Plugin Menu and click on the plus button near the top of the panel
- Paste your copied URL
- Voila! The Token Gating plugin should be installed

## (Alternatively) Running locally
- Start the dev server: `npm start`
- Load the plugin in your space. Select Plugins, press the (+) icon and then paste the address: [http://localhost:9000/plugin.js](http://localhost:9000/plugin.js)
- After making code changes, refresh the page

> **Note:** You can only sideload plugins in a space you are the owner of.

## Using the plugin (Version 1)
- Open the tokens menu (inside admin button on bottom bar)
- Create token/s
- Input fields to specify token rules. Tokens will only activate once a necessary field (e.g. CampaignID, ObjectID, ContractAddress) are filled in.
- Try it out with vatoms from your wallet. You can get the necessary details for your vatoms by opening your wallet -> clicking on a vatom -> clicking on the three dots in top right -> click on general info -> all necessary info should be there
- Can delete token if/when necessary.
- Can specify settings such as multi-condition or time/date restriction
- You can add a token gating component to zone objects. This will allow gating that specific zone. Will have same UI as standard token-gating panel.
- You can save and load your token rules via the buttons at the bottom of the panel.

**Note** Admins by design. Will bypass all entry denial. A popup will be displayed to notify user of this. <br />
**Note** The API query might take few seconds to return before granting or denying entrance to space.