
/**
 * This is the main entry point for your plugin.
 *
 * All information regarding plugin development can be found at
 * https://developer.vatom.com/plugins/plugins/
 *
 * @license MIT
 * @author Vatom Inc.
 */

 import { marked } from 'marked'

export default class TokenGatingPlugin extends BasePlugin {

    /** Plugin info */
    static id = "token-gating"
    static name = "Token Gating"
    static description = "Enables the ability to token gate spaces and regions within spaces"

    // Array of all tokens
    tokens = []

    // Object containing all settings
    settings = {restrictDate: false, dateFrom: null, dateTo: null, multiCondition: 'and'}

    // Reference to userID
    userID = null

    // Reference to user's admin status
    isAdmin = false

    /** Called on load */
    async onLoad() {

        // Create a button in the toolbar
        this.menus.register({
            icon: this.paths.absolute('token.svg'),
            text: 'Tokens',
            inAccordion: true,
            section: 'admin-panel',
            adminOnly: true,
            panel: {
                iframeURL: this.paths.absolute('ui-build/panel/index.html')
            }
        })

        this.objects.registerComponent(TokenGate, {
            id: 'token-gate',
            name: 'Token Gating',
            description: 'Enables token gating for a specific region',
            settings: [
                { id: 'info', type: 'label', value: 'Allows users to token gate this zone' },
                { id: 'clickable', type: 'checkbox', name: 'Open Menu on Click', help: 'When enabled, the token menu will open when clicking on the zone (Admins Only)' },
                { id: 'update-tokens-button', name: 'Update Tokens', type: 'button' },
            ]
        })

        // Get relevant part of userID used for API querying and store it
        let userID = await this.user.getID()
        this.userID = userID.split(':').pop()

        // Get current user's admin status
        this.isAdmin = await this.user.isAdmin()

        // Fetch all saved fields
        this.getSavedSettings()

        // Checks tokens to grant or deny entry
        this.hooks.addHandler('core.space.enter', this.onSpaceEnter)

    }

    /** Called on Unload */
    onUnload() {
        this.hooks.removeHandler('core.space.enter', this.onSpaceEnter)
        if(this.spaceGatingInterval) clearInterval(this.spaceGatingInterval)
        if(this.regionGatingInterval) clearInterval(this.regionGatingInterval)
        if(this.missingTokenTimer) clearTimeout(this.missingTokenTimer)
    }

    /** Fetches all saved settings and assigns them to plugin variables */
    async getSavedSettings() {
        
        // Get saved tokens
        let savedTokens = this.getField('tokens')
        if(savedTokens) this.tokens = savedTokens

        // Get saved settings
        let settings = this.getField('settings')
        if(settings) this.settings = settings
        
    }

    /** Receives postMessages */
    onMessage = async e => {
        // console.log('[Token Gating] Plugin OnMessage: ', e)
        
        // Pass tokens to panel
        if(e.action == 'get-tokens') {
            // console.debug('[Token Gating] Sending tokens to panel')
            // Send panel array of existing tokens
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        if(e.action == 'get-settings'){
            // console.debug('[Token Gating] Sending settings to panel')
            this.menus.postMessage({action: 'send-settings', settings: this.settings}, '*')
        }

        // Updating token gating settings 
        if(e.action == 'update-settings') {
            // console.debug('[Token Gating] Updating token gating settings')

            // Fetch relevant key and value
            let key = Object.keys(e.settings)
            let value = e.settings[key]

            // If we received a region, then update component settings
            if(e.regionID) {
                let components = this.objects.getComponentInstances()
                let component = components.find(c => c.objectID == e.regionID)
                let settings = component.settings
                settings[key] = value
                this.hooks.trigger('set-region-settings', {regionID: e.regionID, settings: settings})
                this.menus.postMessage({action: 'send-settings', regionID: e.regionID, settings: settings}, '*')
                this.messages.send({action: 'refresh-settings', userID: this.userID, regionID: e.regionID, settings: settings})
                return
            }

            // Set new setting value and save
            this.settings[key] = value
            await this.setField('settings', this.settings)
           
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-settings', settings: this.settings}, '*')

            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-settings', userID: this.userID, settings: this.settings})
        }

        // Add a token
        if(e.action == 'add-token') {
            // console.debug('[Token Gating] Adding new Token')
            // Add new token to list of tokens
            this.tokens.push(e.token)
            // Save new token 
            await this.setField('tokens', this.tokens)
            // If token belongs to region, trigger hook to verify access
            if(e.regionID) this.hooks.trigger("set-region-tokens", {regionID: e.regionID})
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        // Update a token
        if(e.action == 'update-token') {
            // console.debug('[Token Gating] Updating token with ID: ' + e.id)
            
            // Get index of token we are updating
            let index = this.tokens.findIndex(t => t.id == e.id);

            // Get key and value of new properties
            let key = Object.keys(e.properties)
            let value = e.properties[key]

            // Assign value to property
            this.tokens[index][key] = value
            // Save token update 
            await this.setField('tokens', this.tokens)
            // If token belongs to region, trigger hook to verify access
            if(e.regionID) this.hooks.trigger("set-region-tokens", {regionID: e.regionID})
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
           
        }

        if(e.action == 'delete-token') {
            // console.debug('[Token Gating] Deleting token with ID: ' + e.id)

            // Get index of token we are updating
            let index = this.tokens.findIndex(t => t.id == e.id);
            // Only splice array if token is found
            if (index > -1) { 
                // Remove token
                this.tokens.splice(index, 1)
            }
            else {
                throw new Error('[Token Gating] Failed to delete token')
            }

            // Save token update 
            await this.setField('tokens', this.tokens)
            // If token belongs to region, trigger hook to verify access
            if(e.regionID) this.hooks.trigger("set-region-tokens", {regionID: e.regionID})
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        // Set tokens 
        if(e.action == 'set-tokens'){
            // console.debug('[Token Gating] Setting token rules')
            // Setting tokens
            this.tokens = e.tokens
            // Save set tokens
            await this.setField('tokens', this.tokens)
            // If token belongs to region, trigger hook to verify access
            if(e.regionID) this.hooks.trigger("set-region-tokens", {regionID: e.regionID})
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        // Called when tokens have been changed
        if(e.action == 'refresh-tokens'){
            
            // Don't need to refresh if we sent the message
            if(this.userID == e.userID){
                return
            }

            // console.debug('[Token Gating] Token rules refreshed')

            this.tokens = e.tokens
            if(e.regionID) this.hooks.trigger("set-region-tokens", {regionID: e.regionID})
            this.menus.postMessage({action: 'send-tokens', tokens: e.tokens}, '*')
        }

        // Called when settings have been change
        if(e.action == 'refresh-settings'){

            // Don't need to refresh if we sent the message
            if(this.userID == e.userID) {
                return
            }

            // console.debug('[Token Gating] Updating token gating settings')
            this.settings = e.settings
            this.menus.postMessage({action: 'send-settings', regionID: e.regionID, settings: e.settings}, '*')  
        }

        // console.group('[Token Gating] Updated Tokens')
        // console.log("[Plugin] ",this.tokens)
        // console.log("[Server] ", this.getField('tokens'))
        // console.groupEnd()
    }

    /** Constructs an API query based on a token's parameters */
    constructQuery(userID, token) {

        // initialize query
        let query = null
        
        // If token belongs to vatom network
        if(token.network == 'vatom') {
                
            // Check vatom token type
            if(token.type == 'nft') {

                // Display warning if campaignID or ObjectID is missing
                if(!token.campaignID || !token.objectID){
                    console.warn(`[Token Gating] Detected the following missing necessary fields for the token with name '${token.name}': ${token.campaignID ? "" : '[CampaignID]'} ${token.objectID ? "" : '[ObjectID]'}`)
                }

                let campaignID = token.campaignID || ""
                let objectID = token.objectID || ""

                // Construct Allowl query for Vatom Smart NFT
                if(token.traits && token.traits.length > 0) {
                    
                    let traits = []
                    for(let trait of token.traits){
                        if(trait.key && trait.value){
                            traits.push(trait)
                        }
                        else{
                            console.error(`[Token Gating] ${token.name} has a trait with a key or value equaling null. {key: ${trait.key}, value: ${trait.value}}. Ignoring this trait in query.`)
                        }
                    }

                    if(token.traits.multiTraitCondition == "and"){
                        query = {query: {"gte":[{"count":{"filter":{"fn":"get-vatoms","owner":userID,"campaign":campaignID,"objectDefinition":objectID}, "by":{ "and": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } }
                    }
                    else{
                        query = {query: {"gte":[{"count":{"filter":{"fn":"get-vatoms","owner":userID,"campaign":campaignID,"objectDefinition":objectID}, "by":{ "or": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } }
                    }
                    
                }
                else {
                    // Construct Allowl query for vatom smart NFT
                    query = {query: {"gte":[{"count":{"fn":"get-vatoms","owner":userID,"campaign":campaignID,"objectDefinition":objectID}}, token.minAmountHeld]}}
                }
               
            }
            else {

                let businessID = token.businessID || ""

                // Construct Allowl query for vatom coins
                if(token.businessID) {
                    query = {query: {"gte":[{"count":{"fn":"get-vatoms","owner":userID,"business":businessID}}, token.minAmountHeld]}}
                }
                else{
                    console.warn(`[Token Gating] No Business ID found for the following Vatom coin token: '${token.name}'. Querying all of user's Vatom Smart NFTs`)
                    query = {query: {"gte":[{"count":{"fn":"get-vatoms","owner":userID}}, token.minAmountHeld]}}
                }

            }
        }
        else {

            // Display warnings if contract address is missing
            if(!token.contractAddress){
                console.warn(`[Token Gating] Detected the following missing necessary fields for the token with name '${token.name}': ${token.contractAddress ? "" : '[ContractAddress]'}`)
            }

            // Display warning if invalid contract address
            if(token.contractAddress && !token.validAddress){
                console.warn(`[Token Gating] The contract address entered for the token with name '${token.name}' is invalid`)
            }

            let contractAddress = token.contractAddress || ""
            
            // Construct Allowl query for Ethereum NFT
            if(token.traits && token.traits.length > 0) {

                let traits = []
                for(let trait of token.traits){
                    if(trait.key && trait.value){
                        traits.push(trait)
                    }
                    else{
                        console.error(`[Token Gating] ${token.name} has a trait with a key or value equaling null. {key: ${trait.key}, value: ${trait.value}}. Ignoring this trait in query.`)
                    }
                }
                
                if(token.multiTraitCondition == "and") {
                    query = { "query": { "any": { "fn": "get-idens", "type": "eth", "user": userID }, "by": { "gte": [ { "count": { "filter": { "fn": "get-eth-nfts", "owner": "$it.value", "contract": contractAddress }, "by": { "and": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } } }
                }
                else{
                    query = { "query": { "any": { "fn": "get-idens", "type": "eth", "user": userID }, "by": { "gte": [ { "count": { "filter": { "fn": "get-eth-nfts", "owner": "$it.value", "contract": contractAddress }, "by": { "or": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } } }
                }
            }
            else {

                query = { "query": { "any": { "fn": "get-idens", "type": "eth", "user": userID }, "by": { "gte": [ { "count": { "fn": "get-eth-nfts", "owner": "$it.value", "contract": contractAddress } }, token.minAmountHeld] } } }

            }
        }

        return query
    }

    /** Converts date string returned from calendar component into date object */
    convertToDate(date) {

        if(!date) {
            console.warn("[Token Gating] Attempted to convert date but date was null")
            return null
        }
                    
        let yearMonthDay = date.split('T')[0]
        yearMonthDay = yearMonthDay.split('-')
        yearMonthDay = yearMonthDay.map(Number)
        
        let time = date.split('T')[1]
        time = time.split(':')
        time - time.map(Number)
        
        let dateObject = new Date(yearMonthDay[0], yearMonthDay[1]-1, yearMonthDay[2], time[0], time[1])
        return dateObject
    }

    /** Called on space enter */
    onSpaceEnter = async () => {
   
        try {
            // Gate space on enter
            await this.gateSpace(false)
            // Periodically check to ensure users still have the correct tokens
            if(!this.isAdmin) this.spaceGatingInterval = setInterval(e => this.gateSpace(true), 15000)
        }
        catch(Err) {
            throw(Err)
        }
    
    }

    /** Called when attempting to gate a space */
    async gateSpace(insideSpace) {

        // Stop space gating interval and clear lost token timer if user was made into admin
        this.isAdmin = await this.user.isAdmin()
        if(this.isAdmin && insideSpace){
            if(this.spaceGatingInterval) clearInterval(this.spaceGatingInterval)
            this.spaceGatingInterval = null
            if(this.missingTokenTimer) clearTimeout(this.missingTokenTimer)
            this.missingTokenTimer = null
            return
        }

        // Filter out region blocking tokens
        let spaceTokens = this.tokens.filter(t => !t.regionID || t.regionID == '')
        
        // Stop if no tokens
        if(spaceTokens.length == 0)
            return
        
        // Counters to keep track of how many tokens have granted/denied access
        let accessGranted = 0
        let accessDenied = 0
 
        // Iterate through all tokens
        for(let token of spaceTokens) {

            // Construct query based on token parameters for given user ID
            let query = this.constructQuery(this.userID, token)

            // Return if query wasn't set
            if(!query) {
                return console.error('[Token Gating] API query was null or undefined. User will be allowed entry to space.')
            }

            // Pass our query to Allowl API
            let response = await this.user.queryAllowlPermission(query)

            // console.group("[Token Gating] Allowl Response")
            // console.debug("Token: ", token)
            // console.debug("Response: ", response)
            // console.groupEnd()

            // If response returns true let user in, otherwise deny access
            if(response.result == true) {
 
                // If we are restricting date
                if(this.settings.restrictDate) {

                    // Get restricted date range
                    let currentDate = new Date()
                    let dateFrom = this.convertToDate(this.settings.dateFrom)
                    let dateTo = this.convertToDate(this.settings.dateTo)
                    
                    // Construct error messages
                    let denialMessage = `The token assigned to this space is only active ${this.settings.dateFrom ? 'from ' + this.formatDateString(this.settings.dateFrom): 'before'}  ${this.settings.dateTo ? this.settings.dateFrom ? ' and before ' + this.formatDateString(this.settings.dateTo) : this.formatDateString(this.settings.dateTo) : ''}`
                    let deactivatedTokenMessage = `Leaving Space in 60 seconds <br><br> Tokens assigned to this space are only active ${this.settings.dateFrom ? 'from ' + this.settings.dateFrom: 'before'}  ${this.settings.dateTo ? this.settings.dateFrom ? ' and before ' + this.settings.dateTo : this.settings.dateTo : ''}`
        
                    // If current date is before dateFrom restriction
                    if(dateFrom) {
                        if(currentDate < dateFrom) {
                            if(insideSpace) {
                                if(!this.missingTokenTimer) {
                                    this.menus.alert(deactivatedTokenMessage, 'Token no longer active', 'info')
                                    this.missingTokenTimer = setTimeout(e => this.kickUser(denialMessage), 60000)
                                }
                            }
                            else{
                                throw new Error(denialMessage)
                            }

                        }
                    }

                    // If current date is after dateTo restriction
                    if(dateTo) {
                        if(currentDate > dateTo) {
                            if(insideSpace) {
                                if(!this.missingTokenTimer){
                                    this.menus.alert(deactivatedTokenMessage, 'Token no longer active', 'info')
                                    this.missingTokenTimer = setTimeout(e => this.kickUser(denialMessage), 60000)
                                }
                            }
                            else{
                                throw new Error(denialMessage)
                            }
                            
                        }
                    }
                }
                
                // If condition is 'and', only grant access if all tokens are possessed
                if(this.settings.multiCondition == 'and') {
                    accessGranted++
                    if(spaceTokens.length == accessGranted){
                        console.debug(`[Token Gating] Entry Granted. User possesses all of the required tokens in their wallet.`)
                        // If in the midst of removing user due to missing token, then stop
                        if(this.missingTokenTimer) {
                            clearTimeout(this.missingTokenTimer)
                            this.missingTokenTimer = null
                        }
                        return
                    }
                }
                else { // Otherwise, condition is 'or' so if any token is possessed, simply grant access
                    console.debug(`[Token Gating] Entry Granted. User possesses any of the required token in their wallet.`)
                    // If in the midst of removing user due to missing token, then stop
                    if(this.missingTokenTimer) {
                        clearTimeout(this.missingTokenTimer)
                        this.missingTokenTimer = null
                    }
                    return
                }
            }
            else {

                // Construct error messages
                let traitToString = token?.traits.length > 0 ? ` with the following traits: <br><br>` + this.tokenTraitsToString(token.traits) : ''
                let denialMessage = token?.denialMessage ? marked.parse(token.denialMessage) : `Missing Access Token <br><br> Access to this space requires that visitors hold ${token.minAmountHeld} of the missing token` + traitToString
                let lostTokenMessage = `Leaving Space in 60 seconds <br><br> Access to this space requires that visitors hold ${token.minAmountHeld} of the missing token` + traitToString

                // If condition is 'and', simply throw error
                if(this.settings.multiCondition == 'and') {
                    if(insideSpace) {
                        if(!this.missingTokenTimer) {
                            this.menus.alert(lostTokenMessage, 'Lost Access Token', 'info')
                            this.missingTokenTimer = setTimeout(e => this.kickUser(denialMessage), 60000)
                        }
                    }
                    else{
                        throw new Error(denialMessage)
                    }
                }
                else { // Otherwise, condition is 'or' so only throw error if no tokens are possessed
                    accessDenied++
                    if(spaceTokens.length == accessDenied) {
                        if(insideSpace) {
                            if(!this.missingTokenTimer){
                                this.menus.alert(lostTokenMessage, 'Lost Access Token', 'info')
                                this.missingTokenTimer = setTimeout(e => this.kickUser(denialMessage), 60000)
                            } 
                        } 
                        else{
                            throw new Error(denialMessage)
                        }
                        
                    }
                }
                
            } 
            
        } 
    }

    /** Kick user out */
    kickUser(message) {
        
        // Clear Timers
        clearInterval(this.regionGatingInterval)
        clearInterval(this.spaceGatingInterval)

        // Open shut down screen 
       this.user.showShutDownScreen(message, "Lost Access Token")
    }

    /** Returns traits as a string */
    tokenTraitsToString(traits, separator='<br>'){
        let stringArray = []
        for(let trait of traits){
            let line = trait.key + ' - ' + trait.value
            stringArray.push(line)
        }
        let string = stringArray.join(separator)
        return string
    }

    /** Format date string */
    formatDateString(date){
        let splitDate = date.split('T')
        let string = splitDate.join(" ")
        return string
    }

}

class TokenGate extends BaseComponent {

    // Tokens assigned to this region
    tokens = []

    // Settings for this region
    settings = {restrictDate: false, dateFrom: null, dateTo: null, multiCondition: "and"}

    // Used to track if we have checked access to the current region
    regionCheck = false
    
    // Used to track if we have been granted access to the current region
    regionAccess = false
 
    // Tracks if we are actively removing user from region
    removingUser = false

    async onLoad() {
        
        // Get region that component is attached to
        this.region = await this.plugin.objects.get(this.objectID)
        
        // Get saved settings
        let settings = this.getField('settings')
        if(settings) this.settings = settings

        // Hooks to update region tokens and settings
        this.plugin.hooks.addHandler('set-region-settings', this.setSettings)
        this.plugin.hooks.addHandler('set-region-tokens', this.setTokens)

        // Set tokens
        this.plugin.hooks.trigger('set-region-tokens', {regionID: this.region.id})

        // Periodically check to ensure specified regions are gated
        this.regionGatingInterval = setInterval(e => this.gateRegion(), 100)
    }

    onUnload() {
        clearInterval(this.regionGatingInterval)
    }


    /** Sets region settings */
    setSettings = async e => {
        
        // Stop if not relevant to this region
        if(e.regionID != this.region.id){
            return
        }
        
        // Set and save settings
        this.settings = e.settings
        await this.setField('settings', this.settings)
    }

    /** Sets region tokens */
    setTokens = async e => {

        // Stop if not relevant to this region
        if(e.regionID != this.region.id){
            return
        }

        // Clear existing tokens
        this.tokens = []

        // Fetch all tokens belonging to this region
        let regionTokens = this.plugin.tokens.filter(t => t.regionID == this.region.id)

        // Stop if no tokens returned
        if(regionTokens.length == 0){
            return
        }

        // Add all tokens along with their access states
        for(let token of regionTokens){
            // Construct query based on token parameters for given user ID
            let query = this.plugin.constructQuery(this.plugin.userID, token)
            // Return if query wasn't set
            if(query) { 
                // Pass our query to Allowl API
                let response = await this.plugin.user.queryAllowlPermission(query)
                // Push token (and access state) to region's list of tokens 
                this.tokens.push({properties: token, access: response.result})
            }
            else{
                console.warn('[Token Gating] API query is null or undefined') 
                // Push token (with access state = true) if query is null
                this.tokens.push({properties: token, access: true})
            }
           
            
        }
    }

    /** Opens token menu for region */
    openTokenMenu(){
        // Pass relevant region data into location hash
        let regionObject = JSON.stringify({id: this.region.id, settings: this.settings})
        this.plugin.menus.displayPopup({
            title: 'Tokens',
            panel: {
                iframeURL: this.paths.absolute(`ui-build/panel/index.html#${regionObject}`),
                width: 320
            }
        })
    }
   
    /** Triggered when clicking object component is attached to */
    onClick() {
        if(this.plugin.isAdmin && this.getField('clickable')) {
            this.openTokenMenu()
        }
    }

    /** Triggered when clicking on component button */
    onAction(id) {
        if(id == 'update-tokens-button') {
            this.openTokenMenu()
        }
        
    }

    /** Token gate the current region */
    async gateRegion() {

        // Stop if no tokens assigned to this region
        if(this.tokens.length == 0){
            return
        }

        // Check if current user is inside zone specified by token
        let insideRegion = await this.userInsideRegion(this.region.id)
            
        // If inside the current region
        if(insideRegion) {

            // Stop if actively removing user already
            if(this.removingUser)
                return

            // Stop if we have checked the region and already given access
            if(this.regionCheck && this.regionAccess)
                return

            // If we have checked the current region and denied access, then kick user out
            if(this.regionCheck && !this.regionAccess) {

                // Let admins bypass denial
                if(this.plugin.isAdmin) {
                    
                    // Construct error messages
                    let denialMessage = ""
                    if(this.dateTimeBlocked){
                        denialMessage = `The token assigned to this region is only active ${this.settings.dateFrom ? 'from ' + this.plugin.formatDateString(this.settings.dateFrom): 'before'}  ${this.settings.dateTo ? this.settings.dateFrom ? ' and before ' + this.plugin.formatDateString(this.settings.dateTo) : this.plugin.formatDateString(this.settings.dateTo) : ''}`
                    }
                    else{
                        let traitToString = this.missingToken?.properties.traits?.length > 0 ? ` with the following traits: <br><br>` + this.plugin.tokenTraitsToString(this.missingToken.properties.traits) : ''
                        denialMessage = this.missingToken?.properties.denialMessage ? marked.parse(this.missingToken.properties?.denialMessage) : `Missing Access Token <br><br> Access to this space requires that visitors hold ${this.missingToken.properties.minAmountHeld} of the missing token` + traitToString    
                    }
                    
                    // Display message
                    denialMessage = denialMessage + ` <br><br> Admins can bypass this denial but other users cannot.`
                    this.plugin.menus.alert(denialMessage, 'Attempted to deny entry', 'warning')
                    
                    // Grant access to user
                    this.regionAccess = true                    
                    return
                }

                // If we have a recorded last position
                if(this.lastUserPosition) {
                    
                    // Get user's current position 
                    let currentPosition = await this.plugin.user.getPosition()
                    
                    // Get normalized direction vector with offset added
                    let directionOffset = this.getNormalizedDirectionVector(this.lastUserPosition, currentPosition, 3)

                    // Record position user should be returned to if they are kicked out of the region
                    if(directionOffset) {
                        this.returnPosition = {
                            x: currentPosition.x + directionOffset.x,
                            y: currentPosition.y + directionOffset.y,
                            z: currentPosition.z + directionOffset.z
                        }
                    }

                }

                // Set return position to our return position reference or last tracked user position as backup
                let returnPosition = this.returnPosition || this.lastUserPosition
                
                // If we know user's last position before entering zone
                if(returnPosition) {
                    // If we aren't already removing user 
                    if(!this.removingUser) {
                        
                        // We are now removing the user
                        this.removingUser = true
                        
                        // Set user position to last recorded position before entering zone
                        this.plugin.user.setPosition(returnPosition.x, returnPosition.y, returnPosition.z)

                        // Construct error messages
                        let denialMessage = ""
                        if(this.dateTimeBlocked) {
                            denialMessage = `The token assigned to this region is only active ${this.settings.dateFrom ? 'from ' + this.plugin.formatDateString(this.settings.dateFrom): 'before'}  ${this.settings.dateTo ? this.settings.dateFrom ? ' and before ' + this.plugin.formatDateString(this.settings.dateTo) : this.plugin.formatDateString(this.settings.dateTo) : ''}`
                        }
                        else {
                            let traitToString = this.missingToken?.properties.traits?.length > 0 ? ` with the following traits: <br><br>` + this.plugin.tokenTraitsToString(this.missingToken.properties.traits) : ''
                            denialMessage = this.missingToken?.properties.denialMessage ? marked.parse(this.missingToken.properties?.denialMessage) : `Missing Access Token <br><br> Access to this space requires that visitors hold ${this.missingToken.properties.minAmountHeld} of the missing token` + traitToString    
                        }
                        
                        // Show denial message
                        this.plugin.menus.alert(denialMessage, 'Entry to region denied', 'error')
                    }
        
                }
                else {
                    // Edge Case: If user's last known position isn't recorded, just move user out slowly in a direction based on region scale
                    let position = await this.plugin.user.getPosition()
                    if(this.region){
                        if(this.region.scale_x > this.region.scale_z) {
                            this.plugin.user.setPosition(position.x, position.y, position.z + 1)
                        }
                        else if (this.region.scale_x < this.region.scale_z) {
                            this.plugin.user.setPosition(position.x + 1, position.y, position.z)
                        }
                        else{
                            this.plugin.user.setPosition(position.x + 1, position.y, position.z + 1)
                        }
                    }
                }

            }

            // If we haven't checked the region yet
            if(!this.regionCheck) {

                // Records how many times user is granted or denied access
                let grantedCounter = 0
                let denialCounter = 0

                for(let token of this.tokens) {

                    // If we've been granted access from the current token
                    if(token.access) {
                        // Check multi-condition settings
                        if(this.settings.multiCondition == 'and') {
                            grantedCounter++
                            if(this.tokens.length == grantedCounter) {
                                console.debug(`[Token Gating] Entry Granted. User possesses all of the required tokens in their wallet.`)
                                this.regionAccess = true
                            }
                        }
                        else{
                            console.debug(`[Token Gating] Entry Granted. User possesses any of the required token in their wallet.`)
                            this.regionAccess = true
                        }    
                    }
                    else{
                        if(this.settings.multiCondition == 'and') {
                            console.debug(`[Token Gating] Entry Denied. User doesn't possess every required token in their wallet.`)
                            this.regionAccess = false
                            this.missingToken = token
                        }
                        else{
                            denialCounter++
                            if(this.tokens.length == denialCounter){
                                console.debug(`[Token Gating] Entry Denied. User doesn't possess any required tokens in their wallet.`)
                                this.regionAccess = false
                                this.missingToken = token
                            }
                        }
                    }
                }
                                    
                // If we have been granted access to the region
                if(this.regionAccess) {
                    
                    // If dates are restricted
                    if(this.settings.restrictDate) {

                        // Convert Date string to date object
                        let currentDate = new Date()
                        let dateFrom = this.plugin.convertToDate(this.settings.dateFrom)
                        let dateTo = this.plugin.convertToDate(this.settings.dateTo)
            
                        // If current date is before dateFrom restriction
                        if(dateFrom) {
                            if(currentDate < dateFrom){
                                console.debug(`[Token Gating] Entry Denied. Tokens for this space will only activate post the following date and time: ${dateFrom}`)
                                this.dateTimeBlocked = true
                                this.regionAccess = false
                            }
                        }
    
                        // If current date is after dateTo restriction
                        if(dateTo) {
                            if(currentDate > dateTo){
                                console.debug(`[Token Gating] Entry Denied. Tokens for this space are no longer active post the following date and time: ${dateTo}`)
                                this.dateTimeBlocked = true
                                this.regionAccess = false
                            }
                        }
            
                    }
                }

                // Have successfully checked the region
                this.regionCheck = true

            }

        }
        else{
            // If user not inside region, set vars to false and track user position
            if(this.regionCheck) this.regionCheck = false
            if(this.removingUser) this.removingUser = false
            if(this.dateTimeBlocked) this.dateTimeBlocked = false
            this.lastUserPosition = await this.plugin.user.getPosition()
        }

    }

    // Check if user is inside region that is token gated
    async userInsideRegion(regionID) {

        // Get user position
        let pos = await this.plugin.user.getPosition()
        let regionCache = {}

        // Get region position
        let region = regionCache[regionID]
        if (!region) {

            // Get region info
            region = await this.plugin.objects.get(regionID)
            regionCache[regionID]

            // Stop if region not found
            if (!region) {
                console.warn(`[Token Gating] no region with Zone ID ${regionID} was found.`)
                return
            }

        }

        // Check if within region
        let minX = region.world_center_x - region.world_bounds_x/2
        let minY = region.world_center_y - region.world_bounds_y/2
        let minZ = region.world_center_z - region.world_bounds_z/2
        let maxX = region.world_center_x + region.world_bounds_x/2
        let maxY = region.world_center_y + region.world_bounds_y/2
        let maxZ = region.world_center_z + region.world_bounds_z/2
        let insideRegion = pos.x > minX && pos.x < maxX && pos.y > minY && pos.y < maxY && pos.z > minZ && pos.z < maxZ

        return insideRegion

    }

    /** Returns a normalized direction vector with optional offset added */
    getNormalizedDirectionVector(pointA, pointB, offset=1){

        // Return if both points are equal
        if(pointA.x == pointB.x && pointA.y == pointB.y && pointA.z == pointB.z){
            return
        }
        
        // Get direction vector between two points
        let direction = {
            x: pointA.x - pointB.x,
            y: pointA.y - pointB.y,
            z: pointA.z - pointB.z,
        }

        // Get magnitude of direction vector
        let magnitude = Math.sqrt((direction.x**2) + (direction.y**2) + (direction.z**2))
                    
        // If magnitude is 0 is means no change in position was recorded so stop
        if(magnitude == 0) {
            return
        }  

        // Normalize direction vector
        let normalizedDirection = {x: direction.x/magnitude, y: direction.y/magnitude, z: direction.z/magnitude}
        // Add offset to normalized direction vector
        let directionOffset = {x: offset * normalizedDirection.x, y: offset * normalizedDirection.y, z: offset * normalizedDirection.z}
        return directionOffset

    }
}
