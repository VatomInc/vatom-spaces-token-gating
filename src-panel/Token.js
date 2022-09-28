import React from 'react';
import {Input, Field, Select, Button, LabeledSwitch} from './panel-components'

export default class Token extends React.PureComponent {
     
    state = {
        id: this.props.token.id,
        name: this.props.token.name || "New Token",
        network: this.props.token.network || "vatom",
        type: this.props.token.type || "nft",
        businessID: this.props.token.businessID || null,
        campaignID: this.props.token.campaignID || null,
        objectID: this.props.token.objectID || null,
        zoneID: this.props.token.zoneID || null,
        minAmountHeld: this.props.token.minAmountHeld || 1,
    }

    /** Updates token field */
    updateToken(data) {
        
        try {
            let message = {action: 'update-token', id: this.props.token.id, properties: data}
            window.parent.postMessage(message, '*');
            this.setState(data)
        }
        catch(err) {
            console.error('[Token Gating] Something went wrong when attempting to update token field')
        }  
        
    }

    /** Deletes this token */
    deleteToken() {
        window.parent.postMessage({action: 'delete-token', id: this.props.token.id}, '*');
        this.forceUpdate()
    }
    
    /** Render */
    render = () => 
    <>
    
        <div style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, marginTop: 18}}>
                        
            <div style={{padding: 5}}/>

            <div style={{display: 'flex', marginLeft: 8, alignItems: 'center'}}>
                <img src={require('./star.svg')} width={20} height={20} />
                <div style={{padding: '0px 5px'}}/>
                <div style={{display: 'inline-block', fontSize: 22, color: '#868E96', fontFamily: 'Inter', fontWeight: 400, fontStyle: 'normal'}}>{this.state.name}</div>
            </div>
            
            <div style={{marginTop: 28}}>
                
                <Field name='Network' help='Network that NFT belongs to.'>
                    <Select value={this.state.network} onValue={v => this.updateToken({network: v })} items={['Vatom', 'Ethereum']} values={['vatom', 'ethereum']} />
                </Field>

                {this.state.network == 'vatom' ? <>

                    <LabeledSwitch onToggle={e => this.updateToken({type: this.state.type == 'nft' ? 'coin' : 'nft'})} labelLeft={"Smart NFT"} labelRight={"Coins"} direction={this.state.type == 'nft' ? 'left' : 'right'}/>

                    <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                    {this.state.type == 'nft' ? <>
                        <Field name='Campaign ID:' help='The Campaign ID for the Vatom Smart NFT collection you wish to use as token keys.'>
                            <Input type='text' value={this.state.campaignID ?? ''} onValue={v => this.updateToken({campaignID: v})} help='Enter the Campaign ID for the Vatom Smart NFT collection you wish to use as token keys.' />
                        </Field>
                        <Field name='Object ID:' help='The Object ID for the Vatom Smart NFT collection you wish to use as token keys.'>
                            <Input type='text' value={this.state.objectID ?? ''} onValue={v => this.updateToken({objectID: v})} help='Enter the Object ID for the Vatom Smart NFT collection you wish to use as token keys.' />
                        </Field>
                    </> : 
                    <>
                        <Field name='Business ID:' help='Input the business ID of the NFT that you wish to associate with this token.'>
                            <Input type='text' value={this.state.businessID ?? ''} onValue={v => this.updateToken({businessID: v})} help='Enter the Business ID of the Vatom coin collection that you wish to use as token keys.' />
                        </Field>
                    </>}

                </> : null}

                <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />
                
                <Field name='Zone ID:' help='The Zone ID of the region that this token should block. Converts token to region blocking token.'>
                    <Input type='text' value={this.state.zoneID ?? ''} onValue={v => this.updateToken({zoneID: v})} help='Enter the Zone ID for the region that this token will gate.' />
                </Field>

                <Field name={`Minimum ${this.state.type == 'nft' ? "tokens" : "coins"} held:`} help='The minimum amount of token keys required to grant access.'>
                    <Input type='number' value={this.state.minAmountHeld ?? 1} onValue={v => this.updateToken({minAmountHeld: v})} help='Enter the minimum amount of token keys required to grant access.' />
                </Field>

                <Button title='Delete Token' onClick={e => this.deleteToken()} style={{color: '#FFFFFF', backgroundColor: '#e85e59', borderRadius: 3, height: 28}}/>
                
                <div style={{padding: 3}}/>

            </div>

            {/* <div style={{padding: 5}}/> */}

        </div>

    </>
}