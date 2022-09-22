import React from 'react';
import {Input, Field} from './panel-components'

export default class Token extends React.PureComponent {
     
    state = {
        id: this.props.id,
        name: this.props.name,
        vatomID: null,
        ZoneID: null
    }

    /** Updates token field */
    updateToken(data) {

        // Detect which field is being updated, then send message to update plugin's token reference
        if(data.vatomID) {
            window.parent.postMessage({action: 'update-token', id: this.props.id, vatomID: data.vatomID}, '*');
            this.setState({vatomID: data.vatomID})
        }
        else if(data.ZoneID){
            window.parent.postMessage({action: 'update-token', id: this.props.id, ZoneID: data.zoneID}, '*');
            this.setState({zoneID: data.zoneID})
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
                <Field name='Vatom ID:' help='Input the ID of the Vatom that you wish to associate with this token.'>
                    <Input type='text' value={this.state.vatomID ?? ''} onValue={v => this.updateToken({vatomID: v})} help='Input the ID of the Vatom that you wish to associate with this token.' />
                </Field>
                {/* <Field name='Zone ID:' help='Zone ID'>
                    <Input type='text' value={this.state.ZoneID ?? ''} onValue={v => this.updateToken({zoneID: v)} help='Vatom ID' />
                </Field> */}
            </div>

            <div style={{padding: 5}}/>

        </div>

    </>
}