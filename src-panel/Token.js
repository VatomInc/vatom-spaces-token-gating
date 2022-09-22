import React from 'react';
import {Input, Field, Select} from './panel-components'

export default class Token extends React.PureComponent {
     
    state = {
        id: this.props.id,
        name: this.props.name,
        network: 'Vatom Network',
        vatomID: null,
        businessID: null,
        campaignID: null,
        objectID: null,
        ZoneID: null,
        minAmountHeld: 1,
    }

    /** Updates token field */
    updateToken(data) {

        // Detect which field is being updated, then send message to update plugin's token reference
        if(data.vatomID) {
            window.parent.postMessage({action: 'update-token', id: this.props.id, vatomID: data.vatomID}, '*');
            this.setState({vatomID: data.vatomID})
        }
        else if(data.businessID){
            window.parent.postMessage({action: 'update-token', id: this.props.id, businessID: data.businessID}, '*');
            this.setState({businessID: data.businessID})
        }
        else if(data.campaignID){
            window.parent.postMessage({action: 'update-token', id: this.props.id, campaignID: data.campaignID}, '*');
            this.setState({campaignID: data.campaignID})
        }
        else if(data.objectID){
            window.parent.postMessage({action: 'update-token', id: this.props.id, objectID: data.objectID}, '*');
            this.setState({objectID: data.objectID})
        }
        else if(data.ZoneID){
            window.parent.postMessage({action: 'update-token', id: this.props.id, ZoneID: data.zoneID}, '*');
            this.setState({zoneID: data.zoneID})
        }
        else if(data.minAmountHeld){
            window.parent.postMessage({action: 'update-token', id: this.props.id, minAmountHeld: data.minAmountHeld}, '*');
            this.setState({minAmountHeld: data.minAmountHeld})
        }
        else {
            // Throw error if correct field is not found
            throw new Error("[Token] Field selected for update could not be found")
        }
        
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
                    <Select value={this.state.network} onValue={v => this.setState({ network: v })} items={['vatom', 'ethereum']} values={['Vatom Network', 'Ethereum']} />
                </Field>
                {this.state.network == 'vatom' ? <>
                
                    <Field name='Business ID:' help='Input the business ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.businessID ?? ''} onValue={v => this.updateToken({businessID: v})} help='Input the business ID of the NFT that you wish to associate with this token.' />
                    </Field>
                    <Field name='Campaign ID:' help='Input the campaign ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.campaignID ?? ''} onValue={v => this.updateToken({campaignID: v})} help='Input the campaign ID of the NFT that you wish to associate with this token.' />
                    </Field>
                    <Field name='Object ID:' help='Input the object ID of the NFT that you wish to associate with this token.'>
                        <Input type='text' value={this.state.objectID ?? ''} onValue={v => this.updateToken({objectID: v})} help='Input the object ID of the NFT that you wish to associate with this token.' />
                    </Field>
                
                </> : null}
                
                {/* <Field name='Zone ID:' help='Zone ID'>
                    <Input type='text' value={this.state.ZoneID ?? ''} onValue={v => this.updateToken({zoneID: v)} help='Vatom ID' />
                </Field> */}
                
                 <Field name='Minimum Tokens Held:' help='Minimum amount of tokens required grant access.'>
                    <Input type='number' value={this.state.minAmountHeld ?? 1} onValue={v => this.updateToken({vatomID: v})} help='Minimum amount of tokens required grant access.' />
                </Field>
            </div>

            <div style={{padding: 5}}/>

        </div>

    </>
}