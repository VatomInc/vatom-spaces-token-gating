import React from 'react';
import Token from './token';
import { Button } from './panel-components';
import { v4 as uuidv4 } from 'uuid' 

export default class TokenList extends React.PureComponent {
 
    /** Render */
    render = () => {

        return <>
    
            {this.props.tokens.map(token => <Token id={token.id} name={token.name}/>)}

            <div style={{padding: 5}}/>

            <Button title='Add another token' onClick={e => this.createToken()} style={{color: '#2EA7FF', backgroundColor: '#F8F9FA', border: '1px solid #CED4DA', borderRadius: 3, height: 28}}/>
    
        </>
    }

    /** Creates new token and sends it to plugin  */
    createToken() {
        console.log('[TokenList] Creating token')

        // Create ID and name
        let id = uuidv4()
        let name = "Token " + this.props.tokens.length+1

        // New token
        let token = {id: id, name: name}

        // Send new token to plugin
        window.parent.postMessage({action: 'add-token', token: token}, '*');
    }
}