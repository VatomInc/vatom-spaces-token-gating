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
            text: 'Tokens',
            inAccordion: true,
            panel: {
                iframeURL: this.paths.absolute('ui-build/panel/index.html')
            }
        })

         // Register settings
        //  this.menus.register({
        //     id: 'token-gating-config',
        //     section: 'plugin-settings',
        //     panel: {
        //         fields: [
        //             { id: 'vatomID', name: 'Vatom ID', default: '', help: 'Vatom ID of Token'},
        //             { id: 'businessID', name: 'Business ID (Optional)', default: '', help: 'Business ID of Token (Will Speed up API query)'},
        //             { id: 'campaignID', name: 'Campaign ID (Optional)', default: '', help: 'Campaign ID of Token (Will Speed up API query)'},
        //             { id: 'objectDef', name: 'Object Definition (Optional)', default: '', help: 'Object Definition of Token (Will Speed up API query)'}
        //         ]
        //     }
        // })

        // this.component = await this.objects.registerComponent(TokenGatingComponent, {
        //     id: 'token-gating-component',
        //     name: 'Token Gating',
        //     description: 'Attach to zone to enable token gating',
        //     settings: []
        // })

        // Get saved tokens
        let savedTokens = this.getField('tokens')
        if(savedTokens) {
            this.tokens = savedTokens
        }

        // console.group('[Token Gating:Plugin] Tokens onLoad')
        // console.log(this.tokens)
        // console.log(this.getField('tokens'))
        // console.groupEnd()

        // Checks tokens to grant or deny entry
        this.hooks.addHandler('core.space.enter', this.onSpaceEnter)

    }

    /** Receives postMessages */
    onMessage = async e => {
        console.log('[Token Gating] Plugin OnMessage: ', e)
        
        // Pass tokens to panel
        if(e.action == 'get-tokens') {
            console.debug('[Token Gating] Sending tokens to panel')
            // Send panel array of existing tokens
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        // Add a token
        if(e.action == 'add-token') {
            console.debug('[Token Gating] Adding new Token')
            // Add new token to list of tokens
            this.tokens.push(e.token)
            // Save new token 
            await this.setField('tokens', this.tokens)
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        // Update a token
        if(e.action == 'update-token') {
            console.debug('[Token Gating] Updating token with ID: ' + e.id)
            
            // Get index of token we are updating
            let index = this.tokens.findIndex(t => t.id == e.id);
            
            if(e.network){
                // Update network that token belongs to    
                this.tokens[index].network = e.network
            }
            else if(e.vatomID) {
                // Update vatomID that token must have
                this.tokens[index].vatomID = e.vatomID
            }
            else if(e.businessID) {
                // Update businessID that token belongs to
                this.tokens[index].businessID = e.businessID
            }
            else if(e.campaignID){
                // Update campaign ID that token belongs to
                this.tokens[index].campaignID = e.campaignID
            }
            else if(e.objectID){
                // Update object ID that token belongs to
                this.tokens[index].objectID = e.objectID
            }
            else if(e.zoneID) {
                // Update zoneID that token must block
                this.tokens[index].zoneID = e.zoneID
            }
            else if(e.minAmountHeld) {
                // Update field dictating the minium amount of this token required
                this.tokens[index].minAmountHeld = e.minAmountHeld
            }
            else {
                // Throw error if neither can be updated
                throw new Error("[Token Gating] Failed to update token field")
            }

            // Save token update 
            await this.setField('tokens', this.tokens)
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }


        if(e.action == 'delete-token'){
            // Get index of token we are updating
            let index = this.tokens.findIndex(t => t.id == e.id);
            // Only splice array if token is found
            if (index > -1) { 
                // Remove token
                this.tokens.splice(index, 1); 
            }
            else {
                throw new Error('[Token Gating] Failed to delete token')
            }

            // Save token update 
            await this.setField('tokens', this.tokens)

            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        console.group('[Token Gating] New Tokens')
        console.log(this.tokens)
        console.log(this.getField('tokens'))
        console.groupEnd()
    }

    onSpaceEnter = async () => {

        let userID = await this.user.getID()
        userID = userID.split(':').pop()

        for(let token of this.tokens){

            // If token's vatomID is null or empty continue
            if (!token.vatomID || token.vatomID == '') {
                console.warn(`[Token Gating] No VatomID found for the following token: ${token}`)
                continue
            }

            // Construct query
            let query = {query: {"fn":"get-vatoms","owner":userID}}
            if(token.businessID) query.query['business'] = token.businessID
            if(token.campaignID) query.query['business'] = token.businessID
            if(token.objectID) query.query['business'] = token.businessID

            // Fetch vatoms returned from query
            let response = await this.user.queryAllowlPermission(query)

            // console.group("Allowl Response")
            // console.debug("Vatom Returned: ", response.result)
            // console.groupEnd()

            // Iterate through all returned vatoms
            for(let vatom of response.result) {
    
                if(vatom.id == token.vatomID ){
                    console.debug(`[Token Gating] Entry Granted. User has the correct tokens in their wallet.`)
                    return
                }
            }
        } 
        
        throw new Error(`[Token Gating] Entry Denied. User does not have the correct tokens in their wallet.`)
    }

}

class TokenGatingComponent extends BaseComponent {

    // TODO: Will be attached to zones in order to token gate areas

    onLoad() {

    }

}
