import React from 'react';
import Token from './token';
import { Button, SplitButton, SplitButtonSection } from './panel-components';
import { v4 as uuidv4 } from 'uuid' 
import JSFileManager, { JSFile } from 'js-file-manager'

export default class TokenList extends React.PureComponent {
 
    /** Render */
    render = () => {

        return <>
    
            {this.props.tokens.map(token => <Token token={token} />)}

            <div style={{padding: 5}}/>

            <Button title='Add token' onClick={e => this.createToken()} style={{color: '#2EA7FF', backgroundColor: '#F8F9FA', border: '1px solid #CED4DA', borderRadius: 3, height: 28}}/>

            <SplitButton>
                <SplitButtonSection title='Load Rules' backgroundColor={'#F8F9FA'}  color={'#2EA7FF'} height={38} onClick={e => this.loadTokens()} />
                <SplitButtonSection title='Save Rules' backgroundColor={'#2EA7FF'} color={'#F8F9FA'} height={38} onClick={e => this.saveTokens()} />
            </SplitButton> 
    
        </>
    }

    /** Creates new token and sends it to plugin  */
    createToken() {
        console.debug('[Token Gating] Creating token from panel')

        // Create ID
        let id = uuidv4()
        
        // Create Name
        let tokenNum = this.props.tokens.length+1
        let name = "Token " + tokenNum

        // New token (default fields)
        let token = {id: id, 
            name: name, 
            network: 'vatom', 
            type: 'nft', 
            campaignID: null, 
            objectID: null, 
            businessID: null, 
            zoneID: null,
            zoneAccess: false,
            minAmountHeld: 1,
            contractAddress: null,
            heldSince: null,
            denialMessage: null,
            multiTraitCondition: 'and',
            traits: []}

        // Send new token to plugin
        window.parent.postMessage({action: 'add-token', token: token}, '*');
    }

    /** Loads token rules as a JSON file */
    async loadTokens(){
        const file = await JSFileManager.pick({ accept: '.json' })
        if (file == null) {
            return
        }

        // File selected is not a JSON file
        if (!file.name.toLowerCase().endsWith('.json')) {
            throw new Error("Please select a JSON file.")
        }

        // Decode file
        const json = await file.getJSON()
        let tokens = json.tokens

        window.parent.postMessage({action: 'set-tokens', tokens: tokens}, '*');

    }

    /** Saves all token rules as JSON file */
    saveTokens(){

    // Create and save file
    let tokens = {tokens: this.props.tokens}
    const file = JSON.stringify(tokens)
    new JSFile(file, `token-rules.json`).save()

    }
}