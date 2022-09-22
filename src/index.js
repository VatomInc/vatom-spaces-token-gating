/**
 * This is the main entry point for your plugin.
 *
 * All information regarding plugin development can be found at
 * https://developer.vatom.com/plugins/plugins/
 *
 * @license MIT
 * @author Vatom Inc.
 */

export default class TokenGatingPlugin extends BasePlugin {

    /** Plugin info */
    static id = "token-gating"
    static name = "Token Gating"

    // Array of all tokens
    tokens = []

    // Reference to component
    component = null

    /** Called on load */
    async onLoad() {

        // Create a button in the toolbar
        this.menus.register({
            icon: this.paths.absolute('button-icon.png'),
            text: 'Token Gating',
            inAccordion: true,
            panel: {
                iframeURL: this.paths.absolute('ui-build/panel/index.html')
            }
        })

         // Register settings
         this.menus.register({
            id: 'token-gating-config',
            section: 'plugin-settings',
            panel: {
                fields: [
                    { id: 'vatomID', name: 'Vatom ID', default: '', help: 'Vatom ID of Token'},
                    { id: 'businessID', name: 'Business ID (Optional)', default: '', help: 'Business ID of Token (Will Speed up API query)'},
                    { id: 'campaignID', name: 'Campaign ID (Optional)', default: '', help: 'Campaign ID of Token (Will Speed up API query)'},
                    { id: 'objectDef', name: 'Object Definition (Optional)', default: '', help: 'Object Definition of Token (Will Speed up API query)'}
                ]
            }
        })

        this.hooks.addHandler('core.space.enter', this.onSpaceEnter)

        // this.component = await this.objects.registerComponent(TokenGatingComponent, {
        //     id: 'token-gating-component',
        //     name: 'Token Gating',
        //     description: 'Attach to zone to enable token gating',
        //     settings: []
        // })

    }

    /** Receives postMessages */
    onMessage = e => {
        console.log('[Plugin] ', e)
        
        // If panel is attempting to fetch tokens
        if(e.action == 'get-tokens') {
            console.log('[Plugin] Sending tokens')
            // Send panel array of existing tokens
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        // If panel has added a token
        if(e.action == 'add-token') {
            console.log('[Plugin] Adding new Token')
            // Add new token to list of tokens
            this.tokens.push(e.token)
            // this.setField('tokens', this.tokens)
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        // If panel is attempting to update a token
        if(e.action == 'update-token') {
            console.log('[Plugin] Updating token with ID: ' + e.id)
            if(e.vatomID) {
                // Update vatomID of token
                let index = this.tokens.findIndex(t => t.id == e.id);
                this.tokens[index].vatomID = e.vatomID
                // Save new tokens to settings 
                // this.setField('tokens', this.tokens)
            }
            else if(e.zoneID) {
                // Update zoneID of token
                let index = this.tokens.findIndex(t => t.id == e.id);
                this.tokens[index].zoneID = e.zoneID
                // Save new tokens to settings 
                // this.setField('tokens', this.tokens)
            }
            else {
                // Throw error if neither can be updated
                throw new Error("[Plugin] Failed to update field")
            }

            console.group('[Plugin] New Tokens')
            console.log(this.tokens)
            console.groupEnd()
        }
    }

    onSpaceEnter = async e => {

        // Get target query fields from settings
        let vatomID = this.getField('vatomID')
        let businessID = this.getField('businessID')
        let campaignID = this.getField('campaignID')
        let objectDef = this.getField('objectDef')

        // If vatomID is null or empty return
        if (!vatomID || vatomID == '') {
            console.warn("[Token Gating] No VatomID selected for token.")
            return
        }

        let userID = await this.user.getID()
        userID = userID.split(':').pop()

        let query = {query: {"fn":"get-vatoms","owner":userID}}

        if(businessID && businessID != '') query.query['business'] = businessID
        if(campaignID && campaignID != '') query.query['campaign'] = campaignID
        if(objectDef && objectDef != '') query.query['objectDefinition'] = objectDef

        let response = await this.user.queryAllowlPermission(query)
        
        console.group("Allowl Response")
        console.log("Target Vatom: ", vatomID)
        console.log("Target Business: ", campaignID)
        console.log("Target Campaign: ", campaignID)
        console.log("Target Object Def: ", campaignID)
        console.log("Vatom Returned: ", response.result)
        console.groupEnd()
        
        // Iterate through all vatoms
        for(let vatom of response.result) {

            if(vatom.id == vatomID) {
                console.debug(`[Entry Granted] User posses vatom with ID ${vatomID}`)
                return
            }
        }

        throw new Error(`[Entry Denied] User does not posses vatom with ID ${vatomID}.`)
    }

}

class TokenGatingComponent extends BaseComponent {

    // TODO: Will be attached to zones in order to token gate areas

    onLoad() {

    }

}
