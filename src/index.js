
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
    static description = "Enables the ability to token gate spaces and regions within spaces"

    // Array of all tokens
    tokens = []

    // Object containing all settings
    settings = {restrictDate: false, dateFrom: null, dateTo: null, multiCondition: 'and'}

    // Reference to userID
    userID = null

    // Used to track if we have checked access to the current region
    currentRegionCheck = false
    
    // Used to track if we have been granted access to the current region
    currentRegionAccess = false

    // Tracks if we are actively removing user from region
    removingUser = false

    /** Called on load */
    async onLoad() {

        // Create a button in the toolbar
        this.menus.register({
            icon: this.paths.absolute('button-icon.png'),
            text: 'Tokens',
            inAccordion: true,
            adminOnly: true,
            panel: {
                iframeURL: this.paths.absolute('ui-build/panel/index.html')
            }
        })

        // Register settings
         this.menus.register({
            id: 'token-gating-settings',
            section: 'plugin-settings',
            panel: {
                fields: [
                    { id: 'denial-msg', name: 'Entry Denial Message', default: 'Space is token gated with a token that you do not possess.', help: 'Message to show when a user is denied access to the space'},
                ]
            }
        })


        // Get relevant part of userID used for API querying and store it
        let userID = await this.user.getID()
        this.userID = userID.split(':').pop()

        // Fetch all saved fields
        this.getSavedSettings()

        // Checks tokens to grant or deny entry
        this.hooks.addHandler('core.space.enter', this.onSpaceEnter)

        // Periodically check to ensure specified regions are gated
        setInterval(this.gateRegions, 1000)

        // console.group('[Token Gating] Starting Tokens')
        // console.log("[Plugin]: ", this.tokens)
        // console.log("[Server]: ", this.getField('tokens'))
        // console.groupEnd()

    }

    /** Fetches all saved settings and assigns them to plugin variables */
    getSavedSettings() {
        
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
            console.debug('[Token Gating] Sending tokens to panel')
            // Send panel array of existing tokens
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
        }

        if(e.action == 'get-settings'){
            console.debug('[Token Gating] Sending settings to panel')
            this.menus.postMessage({action: 'send-settings', settings: this.settings}, '*')
        }

        // Updating token gating settings 
        if(e.action == 'update-settings') {
            console.debug('[Token Gating] Updating token gating settings')

            let key = Object.keys(e.settings)
            let value = e.settings[key]

            this.settings[key] = value

            await this.setField('settings', this.settings)
            
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-settings', settings: this.settings}, '*')

            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-settings', userID: this.userID, settings: this.settings})
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
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        // Update a token
        if(e.action == 'update-token') {
            console.debug('[Token Gating] Updating token with ID: ' + e.id)
            
            // Get index of token we are updating
            let index = this.tokens.findIndex(t => t.id == e.id);

            // Get key and value of new properties
            let key = Object.keys(e.properties)
            let value = e.properties[key]

            // Assign value to property
            this.tokens[index][key] = value

            // Save token update 
            await this.setField('tokens', this.tokens)
            
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')

            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        if(e.action == 'delete-token') {
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
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        // Set tokens 
        if(e.action == 'set-tokens'){
            console.debug('[Token Gating] Setting token rules')
            this.tokens = e.tokens
            this.setField('tokens', this.tokens)
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

            console.debug('[Token Gating] Token rules refreshed')

            this.tokens = e.tokens
            this.menus.postMessage({action: 'send-tokens', tokens: e.tokens}, '*')
        }

        // Called when settings have been change
        if(e.action == 'refresh-settings'){

            // Don't need to refresh if we sent the message
            if(this.userID == e.userID){
                return
            }

            console.debug('[Token Gating] Updating token gating settings')
            this.settings = e.settings
            this.menus.postMessage({action: 'send-settings', settings: e.settings}, '*')  
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

                // Check if necessary field are not null
                if(!token.campaignID || !token.objectID){
                    console.error(`[Token Gating] No CampaignID or Object ID found for the following Vatom smart NFT token: ${token}`)
                    return
                }

                // TODO: Add support for multiple trait filtering

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
                        query = {query: {"gte":[{"count":{"filter":{"fn":"get-vatoms","owner":userID,"campaign":token.campaignID,"objectDefinition":token.objectID}, "by":{ "and": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } }
                    }
                    else{
                        query = {query: {"gte":[{"count":{"filter":{"fn":"get-vatoms","owner":userID,"campaign":token.campaignID,"objectDefinition":token.objectID}, "by":{ "or": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } }
                    }
                    
                }
                else {
                    // Construct Allowl query for vatom smart NFT
                    query = {query: {"gte":[{"count":{"fn":"get-vatoms","owner":userID,"campaign":token.campaignID,"objectDefinition":token.objectID}}, token.minAmountHeld]}}
                }
               
            }
            else {

                // Construct Allowl query for vatom coins
                if(token.businessID) {
                    query = {query: {"gte":[{"count":{"fn":"get-vatoms","owner":userID,"business":token.businessID}}, token.minAmountHeld]}}
                }
                else{
                    console.warn(`[Token Gating] No Business ID found for the following Vatom coin token: ${token} querying all Vatom Smart NFTs`)
                    query = {query: {"gte":[{"count":{"fn":"get-vatoms","owner":userID}}, token.minAmountHeld]}}
                }

            }
        }
        else {

            // TODO: Add support for "held since" token setting

            // Check if necessary field are not null
            if(!token.contractAddress || !token.validAddress){
                console.error(`[Token Gating] The contract address was not found or invalid for the following Vatom smart NFT token: ${token}`)
                return
            }
            
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
                    query = { "query": { "any": { "fn": "get-idens", "type": "eth", "user": userID }, "by": { "gte": [ { "count": { "filter": { "fn": "get-eth-nfts", "owner": "$it.value", "contract": token.contractAddress }, "by": { "and": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } } }
                }
                else{
                    query = { "query": { "any": { "fn": "get-idens", "type": "eth", "user": userID }, "by": { "gte": [ { "count": { "filter": { "fn": "get-eth-nfts", "owner": "$it.value", "contract": token.contractAddress }, "by": { "or": traits.map(trait => ({ "eq": [ { "select": [ "it", "attributes", trait.key ] }, trait.value ] })) } } }, token.minAmountHeld] } } }
                }
            }
            else {

                query = { "query": { "any": { "fn": "get-idens", "type": "eth", "user": userID }, "by": { "gte": [ { "count": { "fn": "get-eth-nfts", "owner": "$it.value", "contract": token.contractAddress } } , token.minAmountHeld] } } }

            }
        }

        return query
    }

    /** Formats date string returned from calendar component into date object */
    formatDateString(date) {

        if(!date) {
            console.warn("[Token Gating] Attempted to format date but date was null")
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

    /** Called when user enters the space */
    onSpaceEnter = async () => {

        // Counters to keep track of how many tokens have granted/denied access
        let accessGranted = 0
        let accessDenied = 0

        // Iterate through all tokens
        for(let token of this.tokens) {

            // If token has zoneID field then continue
            if(token.zoneID) {
                continue
            }

            // Construct query based on token parameters for given user ID
            let query = this.constructQuery(this.userID, token)

            // Return if query wasn't set
            if(!query) {
                return console.error('[Token Gating] API query is null or undefined')
            }

            // Pass our query to Allowl API
            let response = await this.user.queryAllowlPermission(query)

            console.group("[Token Gating] Allowl Response")
            console.debug("Token: ", token)
            console.debug("Response: ", response)
            console.groupEnd()

            // If response returns true let user in, otherwise deny access
            if(response.result == true) {

                // If we are restricting date
                if(this.settings.restrictDate) {

                    let currentDate = new Date()
                    let dateFrom = this.formatDateString(this.settings.dateFrom)
                    let dateTo = this.formatDateString(this.settings.dateTo)
         
                    // If current date is before dateFrom restriction
                    if(dateFrom) {
                        if(currentDate < dateFrom) {
                            throw new Error(`Entry Denied. Tokens for this space will only activate post the following date and time: ${dateFrom}`)
                        }
                    }

                    // If current date is after dateTo restriction
                    if(dateTo) {
                        if(currentDate > dateTo) {
                            throw new Error(`Entry Denied. Tokens for this space are no longer active post the following date and time: ${dateTo}`)
                        }
                    }
                }
                
                // If condition is 'and', only grant access if all tokens are possessed
                if(this.settings.multiCondition == 'and') {
                    accessGranted++
                    if(this.tokens.length == accessGranted){
                        console.debug(`[Token Gating] Entry Granted. User possesses the correct tokens in their wallet.`)
                        return
                    }
                }
                else { // Otherwise, condition is 'or' so if any token is possessed, simply grant access
                    console.debug(`[Token Gating] Entry Granted. User possesses a correct token in their wallet.`)
                    return
                }
            }
            else {
                // If condition is 'and', simply throw error
                if(this.settings.multiCondition == 'and'){
                    let err = this.getField('denial-msg') || "Space is token gated with a token that you do not possess."
                    throw new Error(err)
                }
                else { // Otherwise, condition is 'or' so only throw error if no tokens are possessed
                    accessDenied++
                    if(this.tokens.length == accessDenied) {
                        let err = this.getField('denial-msg') || "Space is token gated with a token that you do not possess."
                        throw new Error(err)
                    }
                }
               
            } 
           
        } 
        
    }

    // Check if user is inside region that is token gated
    async userInsideRegion(zoneID) {

        // Get user position
        let pos = await this.user.getPosition()
        let regionCache = {}

        // Get region position
        let region = regionCache[zoneID]
        if (!region) {

            // Get region info
            region = await this.objects.get(zoneID)
            regionCache[zoneID]

            // Stop if region not found
            if (!region) {
                console.warn(`[Token Gating] no region with Zone ID ${zoneID} was found.`)
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

    /** Token gate regions specified by tokens */
    gateRegions = async () => {
    
        // Filter out all tokens that don't have an assigned zoneID
        let regionTokens = this.tokens.filter(t => t.zoneID)
        
        // Return if no tokens specify a zoneID
        if(regionTokens.length == 0){
            return
        }

        // Iterate through all region blocking tokens
        for(let token of regionTokens) {

            // Check if current user is inside zone specified by token
            let userInsideRegion = await this.userInsideRegion(token.zoneID)
            if(userInsideRegion) {

                // Stop if actively removing user already
                if(this.removingUser)
                    return

                // If we have checked the current region and denied access, then kick user out
                if(this.currentRegionCheck && !this.currentRegionAccess) {

                    // If we know user's last position before entering zone
                    if(this.lastUserPosition){
                        
                        // If we aren't already removing user 
                        if(!this.removingUser) {
                            this.removingUser = true
                            // Set user position to last recorded position before entering zone
                            this.user.setPosition(this.lastUserPosition.x, this.lastUserPosition.y, this.lastUserPosition.z)
                            if(this.dateTimeBlocked) {
                                this.menus.alert(`The Token assigned to this region is only valid ${this.settings.dateFrom ? 'from ' + this.settings.dateFrom: 'after'}  ${this.settings.dateTo ? this.settings.dateFrom ? 'and after ' + this.settings.dateTo : this.settings.dateTo : ''}`,'Entry to region denied', 'error')
                            }
                            else {
                                this.menus.alert('Entry to region denied', "You do not possess the correct token required to enter this region", 'error')
                            }
                        }
            
                    }
                    else {
                        // Edge Case: If user's last known position isn't recorded, just move user out via top right
                        let position = await this.user.getPosition()
                        this.user.setPosition(position.x + 2, position.y, position.z + 2)
                    }

                }

                // If we have not yet checked the current region
                if(!this.currentRegionCheck) {
                    
                    // Construct query based on token parameters
                    let query = this.constructQuery(this.userID, token)

                    // Initialize response to false
                    let response = {result: false}
                    // If query is returned
                    if(query) {
                        // Pass our query to Allowl API
                        response = await this.user.queryAllowlPermission(query)
                    }
                                        
                    // Track reference to API result
                    this.currentRegionAccess = response.result
                   
                    // If We have been granted access to the region
                    if(this.currentRegionAccess) {
                        
                        // If dates are restricted
                        if(this.settings.restrictDate) {

                            let currentDate = new Date()
                            let dateFrom = this.formatDateString(this.settings.dateFrom)
                            let dateTo = this.formatDateString(this.settings.dateTo)
                 
                            // If current date is before dateFrom restriction
                            if(dateFrom) {
                                if(currentDate < dateFrom){
                                    console.warn(`[Token Gating] Entry Denied. Tokens for this space will only activate post the following date and time: ${dateFrom}`)
                                    this.dateTimeBlocked = true
                                    this.currentRegionAccess = false
                                }
                            }
        
                            // If current date is after dateTo restriction
                            if(dateTo) {
                                if(currentDate > dateTo){
                                    console.warn(`[Token Gating] Entry Denied. Tokens for this space are no longer active post the following date and time: ${dateTo}`)
                                    this.dateTimeBlocked = true
                                    this.currentRegionAccess = false
                                }
                            }
                 
                        }
                    }

                    console.debug(`[Token Gating] Entry ${response.result ? 'Granted' : 'Denied'} to region with ID: ${token.zoneID}`)                    

                    this.currentRegionCheck = true

                }

                return

            }
            else {
                // If user not inside region, set vars to false and track user position
                if(this.currentRegionCheck) this.currentRegionCheck = false
                if(this.currentRegionAccess) this.currentRegionAccess = false
                if(this.removingUser) this.removingUser = false
                if(this.dateTimeBlocked) this.dateTimeBlocked = false
                this.lastUserPosition = await this.user.getPosition()
            }
           
        }

    }


}
