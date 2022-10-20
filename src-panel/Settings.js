import React from 'react';
import {Field, Select, DateTimePicker, Checkbox} from './panel-components'

export default class Settings extends React.PureComponent {
     
    /** Updates the token gating settings */
    updateSettings(data) {

        console.debug('[Token Gating] Panel settings updated: ', data)

        try {
            let message = {action: 'update-settings', settings: data, regionID: this.props.regionID}
            window.parent.postMessage(message, '*');
        }
        catch(err) {
            console.error('[Token Gating] Something went wrong when attempting to update token field')
        }  
    }

    render = () => <>

        <div style={{display: 'flex', marginTop: 8, marginLeft: 8, alignItems: 'center'}}>
            <img src={require('./settings.svg')} width={20} height={20} />
            <div style={{padding: '0px 5px'}}/>
            <div style={{fontSize: 22, color: '#868E96', fontWeight: 400, fontStyle: 'normal'}}>Settings</div>
        </div>

        <Field name='Restrict Time / Date' help='Restrict Token Gating to specific date and time range.'>
            <Checkbox on={this.props.settings.restrictDate} onToggle={v => this.updateSettings({restrictDate: v})} />
        </Field>

        {this.props.settings.restrictDate ? <>
            <Field style={{width: '60%'}} name='Time / Date From (optional)' help='Time / Date from which tokens are active'>
                <DateTimePicker value={this.props.settings.dateFrom} onValue={v => this.updateSettings({dateFrom: v.target.value})}/>
            </Field>

            <Field style={{width: '60%'}} name='Time / Date To (optional)' help='Time / Date to which tokens will be active'>
                <DateTimePicker value={this.props.settings.dateTo} onValue={v => this.updateSettings({dateTo: v.target.value})}/>
            </Field>
        </>: null}

        <Field name='Multi-Token Condition' help='Decides wether any or all tokens are needed to grant access'>
            <Select value={this.props.settings.multiCondition} onValue={v => this.updateSettings({multiCondition: v })} items={['And', 'Or']} values={['and', 'or']} />
        </Field>
        
        <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

    </>

}