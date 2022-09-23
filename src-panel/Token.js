import React from 'react';
import {Input, Field, Select, Button} from './panel-components'

export default class Token extends React.PureComponent {
     
    state = {
        id: this.props.token.id,
        name: this.props.token.name || "New Token",
        network: this.props.token.network || 'vatom',
        vatomID: this.props.token.vatomID || null,
        businessID: this.props.token.businessID || null,
        campaignID: this.props.token.campaignID || null,
        objectID: this.props.token.objectID || null,
        ZoneID: this.props.token.zoneID || null,
        minAmountHeld: this.props.token.minAmountHeld || 1,
    }

    /** Updates token field */
    updateToken(data) {

        // Detect which field is being updated, then send message to update plugin's token reference
        if(data.network) {
            window.parent.postMessage({action: 'update-token', id: this.props.token.id, network: data.network}, '*');
            this.setState({network: data.network})
        }
        else if(data.vatomID) {
            window.parent.postMessage({action: 'update-token', id:this.props.token.id, vatomID: data.vatomID}, '*');
            this.setState({vatomID: data.vatomID})
        }
        else if(data.businessID) {
            window.parent.postMessage({action: 'update-token', id: this.props.token.id, businessID: data.businessID}, '*');
            this.setState({businessID: data.businessID})
        }
        else if(data.campaignID) {
            window.parent.postMessage({action: 'update-token', id: this.props.token.id, campaignID: data.campaignID}, '*');
            this.setState({campaignID: data.campaignID})
        }
        else if(data.objectID) {
            window.parent.postMessage({action: 'update-token', id: this.props.token.id, objectID: data.objectID}, '*');
            this.setState({objectID: data.objectID})
        }
        else if(data.ZoneID) {
            window.parent.postMessage({action: 'update-token', id: this.props.token.id, ZoneID: data.zoneID}, '*');
            this.setState({zoneID: data.zoneID})
        }
        else if(data.minAmountHeld) {
            window.parent.postMessage({action: 'update-token', id: this.props.token.id, minAmountHeld: data.minAmountHeld}, '*');
            this.setState({minAmountHeld: data.minAmountHeld})
        }
        else {
            // Throw error if correct field is not found
            throw new Error("[Token] Field selected for update could not be found")
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
                
                    <Field name='Vatom ID:' help='Input the Vatom ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.vatomID ?? ''} onValue={v => this.updateToken({vatomID: v})} help='Input the vatom ID of the NFT that you wish to associate with this token.' />
                    </Field>

                    <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                    <Field name='Business ID (optional):' help='Input the business ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.businessID ?? ''} onValue={v => this.updateToken({businessID: v})} help='Input the business ID of the NFT that you wish to associate with this token.' />
                    </Field>
                    <Field name='Campaign ID (optional):' help='Input the campaign ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.campaignID ?? ''} onValue={v => this.updateToken({campaignID: v})} help='Input the campaign ID of the NFT that you wish to associate with this token.' />
                    </Field>
                    <Field name='Object ID (optional):' help='Input the object ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.objectID ?? ''} onValue={v => this.updateToken({objectID: v})} help='Input the object ID of the NFT that you wish to associate with this token.' />
                    </Field>
                
                </> : null}

                <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                {/* <Field name='Zone ID:' help='Zone ID of the zone you wish to token gate. This will turn this token into a region blocker instead of a space blocker.''>
                    <Input type='text' value={this.state.ZoneID ?? ''} onValue={v => this.updateToken({zoneID: v)} help='Zone ID of the zone you wish to token gate. This will turn this token into a region blocker instead of a space blocker.' />
                </Field> */}
                
                {/* <Field name='Minimum Tokens Held:' help='Minimum amount of tokens required grant access.'>
                    <Input type='number' value={this.state.minAmountHeld ?? 1} onValue={v => this.updateToken({minAmountHeld: v})} help='Minimum amount of tokens required grant access.' />
                </Field> */}

                <Button title='Delete Token' onClick={e => this.deleteToken()} style={{color: '#FFFFFF', backgroundColor: '#e85e59', borderRadius: 3, height: 28}}/>

            </div>

            {/* <div style={{padding: 5}}/> */}

        </div>

    </>
}