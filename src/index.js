
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

    // Reference to user's admin status
    isAdmin = false

    // Used to track if we have checked access to the current region
    currentRegionCheck = false
    
    // Used to track if we have been granted access to the current region
    currentRegionAccess = false

    // Tracks if we are actively removing user from region
    removingUser = false

    // Reference to all gated regions and if a user is permitted access to them
    gatedRegions = []

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

        // Check user's region access
        await this.setRegionAccess()
        
    }

    /** Sets reference to all gated regions in a space and wether the current user has access to them */
    async setRegionAccess() {
        this.gatedRegions = []
        for(let token of this.tokens) {
            if(token.zoneID) {
                
                // Query API to see if user is allowed access to region 
                let query = this.constructQuery(this.userID, token)
                let response = query ? await this.user.queryAllowlPermission(query) : {result: false}
                this.gatedRegions.push({id: token.zoneID, access: response.result, token: token})

                // If in the midst of removing user due to missing token, then stop
                if(this.missingTokenTimer) {
                    clearTimeout(this.missingTokenTimer)
                    this.missingTokenTimer = null
                }

            }
        }

        // console.group("Gated Regions")
        // console.log(this.gatedRegions)
        // console.groupEnd()
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

            // Checks region access of updated tokens
            this.setRegionAccess()
            
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')

            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        if(e.action == 'delete-token') {
            console.debug('[Token Gating] Deleting token with ID: ' + e.id)

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
            // Checks region access of remaining tokens
            this.setRegionAccess()
            // Send updated token list back to panel
            this.menus.postMessage({action: 'send-tokens', tokens: this.tokens}, '*')
            // Send message to notify other users that tokens have changed
            this.messages.send({action: 'refresh-tokens', userID: this.userID, tokens: this.tokens})
        }

        // Set tokens 
        if(e.action == 'set-tokens'){
            console.debug('[Token Gating] Setting token rules')
            // Setting tokens
            this.tokens = e.tokens
            // Save set tokens
            await this.setField('tokens', this.tokens)
            // Checks region access of remaining tokens
            this.setRegionAccess()
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
            this.setRegionAccess()
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
                    // console.error(`[Token Gating] No CampaignID or Object ID found for the Vatom smart NFT with ID: ${token.id}`)
                    return
                }

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
            // If space gating function throws error, intervals wont start (However, admins always enter hence why region interval executes first)
            if(this.isAdmin) {
                // Periodically check to ensure specified regions are gated
                this.regionGatingInterval = setInterval(e => this.gateRegions(), 100)
                // Gate space on enter
                await this.gateSpace(false)
            }
            else{
                // Gate space on enter
                await this.gateSpace(false)
                // Periodically check to ensure users still have the correct tokens
                this.spaceGatingInterval = setInterval(e => this.gateSpace(true), 15000)
                // Periodically check to ensure specified regions are gated
                this.regionGatingInterval = setInterval(e => this.gateRegions(), 100)
            }
        }
        catch(Err) {
            throw(Err)
        }
    
    }

    /** Called when attempting to gate a space */
    async gateSpace(insideSpace) {

        // Filter out region blocking tokens
        let spaceTokens = this.tokens.filter(t => !t.zoneID || t.zoneID == '')
        
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
                return console.error('[Token Gating] API query is null or undefined')
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
                        console.debug(`[Token Gating] Entry Granted. User possesses the correct tokens in their wallet.`)
                        // If in the midst of removing user due to missing token, then stop
                        if(this.missingTokenTimer) {
                            clearTimeout(this.missingTokenTimer)
                            this.missingTokenTimer = null
                        }
                        return
                    }
                }
                else { // Otherwise, condition is 'or' so if any token is possessed, simply grant access
                    console.debug(`[Token Gating] Entry Granted. User possesses a correct token in their wallet.`)
                    // If in the midst of removing user due to missing token, then stop
                    if(this.missingTokenTimer) {
                        clearTimeout(this.missingTokenTimer)
                        this.missingTokenTimer = null
                    }
                    return
                }
            }
            else {

                // TODO: Add link 'token' for missing token
                // Construct error messages
                let traitToString = token?.traits?.length > 0 ? ` with the following traits: <br><br>` + this.tokenTraitsToString(token.traits) : ''
                let denialMessage = token.denialMessage || `Missing Access Token <br><br> Access to this space requires that visitors hold ${token.minAmountHeld} of this <u>token</u>` + traitToString
                let lostTokenMessage = `Leaving Space in 60 seconds <br><br> Access to this space requires that visitors hold ${token.minAmountHeld} of this token` + traitToString

                // If condition is 'and', simply throw error
                if(this.settings.multiCondition == 'and') {
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
    async gateRegions() {

        // Return if no regions are gated
        if(this.gatedRegions.length == 0){
            return
        }

        // Iterate through all region blocking tokens
        for(let region of this.gatedRegions) {

            // Check if current user is inside zone specified by token
            let insideRegion = await this.userInsideRegion(region.id)
            if(insideRegion) {
                this.currentRegion = region
                break
            }
            else{
                this.currentRegion = null
            }      
                
        }       

        if(this.currentRegion) {

            // Stop if actively removing user already
            if(this.removingUser)
                return

            // Stop if already given access
            if(this.currentRegionAccess)
                return

            // If we have checked the current region and denied access, then kick user out
            if(this.currentRegionCheck && !this.currentRegionAccess) {

                // Let admins bypass denial
                if(this.isAdmin) {
                    
                    // TODO: Add link 'this token' for missing token
                    // Construct error messages
                    let traitToString = this.currentRegion.token?.traits?.length > 0 ? ` with the following traits: <br><br>` + this.tokenTraitsToString(this.currentRegion.token.traits) : ''
                    let denialMessage = this.currentRegion.token.denialMessage || `Missing Access Token <br><br> Access to this space requires that visitors hold ${this.currentRegion.token.minAmountHeld} of this <u>token</u>` + traitToString
                    let deactivatedTokenMessage = `The token assigned to this region is only active ${this.settings.dateFrom ? 'from ' + this.formatDateString(this.settings.dateFrom): 'before'}  ${this.settings.dateTo ? this.settings.dateFrom ? ' and before ' + this.formatDateString(this.settings.dateTo) : this.formatDateString(this.settings.dateTo) : ''}`

                    // Display message
                    let message = this.dateTimeBlocked ? deactivatedTokenMessage : denialMessage + ` <br><br> Admins can bypass this denial but other users cannot.`
                    this.menus.alert(message, 'Attempted to deny entry', 'warning')
                    
                    // Grant access to user
                    this.currentRegionAccess = true
                    
                    return
                }

                // If we have a recorded last position
                if(this.lastUserPosition) {
                    
                    // Get user's current position 
                    let currentPosition = await this.user.getPosition()
                    
                    // Get normalized direction vector with offset added
                    let directionOffset = this.getNormalizedDirectionVector(this.lastUserPosition, currentPosition, 3)

                    if(directionOffset){
                        // Record position user should be returned to if they are kicked out of the region
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
                if(returnPosition){
                    // If we aren't already removing user 
                    if(!this.removingUser) {
                        this.removingUser = true
                        // Set user position to last recorded position before entering zone
                        this.user.setPosition(returnPosition.x, returnPosition.y, returnPosition.z)

                        // TODO: Add link 'this token' for missing token
                        // Construct error messages
                        let traitToString = this.currentRegion.token?.traits?.length > 0 ? ` with the following traits: <br><br>` + this.tokenTraitsToString(this.currentRegion.token.traits) : ''
                        let denialMessage = this.currentRegion.token.denialMessage || `Missing Access Token <br><br> Access to this space requires that visitors hold ${this.currentRegion.token.minAmountHeld} of this <u>token</u>` + traitToString
                        let deactivatedTokenMessage = `The token assigned to this region is only active ${this.settings.dateFrom ? 'from ' + this.formatDateString(this.settings.dateFrom): 'before'}  ${this.settings.dateTo ? this.settings.dateFrom ? ' and before ' + this.formatDateString(this.settings.dateTo) : this.formatDateString(this.settings.dateTo) : ''}`
                        
                        // Show popup
                        let message = this.dateTimeBlocked ? deactivatedTokenMessage : denialMessage
                        this.menus.alert(message, 'Entry to region denied', 'error')
                    }
        
                }
                else {
                    // Edge Case: If user's last known position isn't recorded, just move user out slowly in a direction based on region scale
                    let position = await this.user.getPosition()
                    if(!this.currentRegionProps) this.currentRegionProps = await this.objects.get(this.currentRegion.id)
                    if(this.regionMapItem){
                        if(this.currentRegionProps.scale_x > this.currentRegionProps.scale_z) {
                            this.user.setPosition(position.x, position.y, position.z + 1)
                        }
                        else if (this.currentRegionProps.scale_x < this.currentRegionProps.scale_z) {
                            this.user.setPosition(position.x + 1, position.y, position.z)
                        }
                        else{
                            this.user.setPosition(position.x + 1, position.y, position.z + 1)
                        }
                    }
                }

            }

            // If we have not yet checked the current region
            if(!this.currentRegionCheck) {
                                     
                // Track reference to API result
                this.currentRegionAccess = this.currentRegion.access
               
                // If We have been granted access to the region
                if(this.currentRegionAccess) {
                    
                    // If dates are restricted
                    if(this.settings.restrictDate) {

                        let currentDate = new Date()
                        let dateFrom = this.convertToDate(this.settings.dateFrom)
                        let dateTo = this.convertToDate(this.settings.dateTo)
             
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

                console.debug(`[Token Gating] Entry ${this.currentRegion.access ? 'Granted' : 'Denied'} to region with ID: ${this.currentRegion.id}`)                    

                // Current region check over
                this.currentRegionCheck = true

            }

        }
        else{
            // If user not inside region, set vars to false and track user position
            if(this.currentRegionCheck) this.currentRegionCheck = false
            if(this.currentRegionAccess) this.currentRegionAccess = false
            if(this.removingUser) this.removingUser = false
            if(this.dateTimeBlocked) this.dateTimeBlocked = false
            this.lastUserPosition = await this.user.getPosition()
        }

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
