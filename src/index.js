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
            },
            action: () => this.onSpaceEnter()
        })

         // Register settings
         this.menus.register({
            id: 'token-gating-config',
            section: 'plugin-settings',
            panel: {
                fields: [
                    { id: 'vatomID', name: 'Vatom ID', default: '', help: 'Vatom ID of Token'},
                    { id: 'businessID', name: 'Business ID', default: '', help: 'Business ID of Token (Optional)'},
                    { id: 'campaignID', name: 'Campaign ID', default: '', help: 'Campaign ID of Token (Optional)'},
                    { id: 'objectDef', name: 'Object Definition', default: '', help: 'Object Definition (e.g. video, image, model, etc) of Token (Optional)'}
                ]
            }
        })

        // this.hooks.addHandler('core.space.enter', this.onSpaceEnter)

        console.log("PLUGIN ON LOAD")

        this.onSpaceEnter()

        console.log('SPACE ENTER FINISHED')

        // this.component = await this.objects.registerComponent(TokenGatingComponent, {
        //     id: 'token-gating-component',
        //     name: 'Token Gating',
        //     description: 'Attach to zone to enable token gating',
        //     settings: []
        // })

        // this.tokens = this.getField("tokens")

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
 
        let profile = null
        let startTime = Date.now()
        while (true) {
            profile = await this.hooks.trigger('vatoms.blockv.profile.get')
            if (profile) break
            if (Date.now() - startTime > 15000) throw new Error("Failed to load the user's BLOCKv profile within 15 seconds. Please check if you have the Vatom plugin installed.")
            await new Promise(c => setTimeout(c, 1000))
        }

        console.log("Profile")
        console.log(profile)

        //let userID = await this.user.getID()
        let userID = profile.id

        // {"lt":[0,{"count":{"filter":{"fn":"get-sol-nfts","owner":"CzudZFmWGwSY4SfwU2itGWNELWLLztm1DLpv3TBH8ks9"},"by":{"eq":["Golden Waves On Blue Ocean",{"select":["it","attributes","Side Face"]}]}}}]}
        let query = {query: {"fn":"get-vatoms","owner":userID}}

        if(businessID && businessID != '') query.query['business'] = businessID
        if(campaignID && campaignID != '') query.query['campaign'] = campaignID
        if(objectDef && objectDef != '') query.query['objectDefinition'] = objectDef

        console.log(query)

        let vatoms = await this.user.queryAllowlPermission(query)
        
        console.group("Allowl Response")
        console.log("Target Vatom: ", vatomID)
        console.log("Vatoms: ", vatoms)
        console.groupEnd()

        // // Iterate through all vatoms
        // for(let vatom of vatoms) {
        //     // TODO: Check if vatom associated with token is in wallet
        //     if(vatom.id == vatomID){
        //         console.log(`[Entry Granted] User posses vatom with ID ${vatomID}`)
        //         return
        //     }
        // }

        // throw new Error(`[Entry Denied] User does not posses vatom with ID ${vatomID}.`)
    }

}

class TokenGatingComponent extends BaseComponent {

    // TODO: Will be attached to zones in order to token gate areas

    onLoad() {

    }

}
