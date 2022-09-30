import React from 'react';
import {Field, Select, DateTimePicker, Checkbox} from './panel-components'

export default class Settings extends React.PureComponent {
     
    state = {
        restrictDate: this.props.settings.restrictDate || false,
        dateFrom: this.props.settings.dateFrom || null,
        dateTo: this.props.settings.dateTo || null,
        multiCondition: this.props.settings.multiCondition || 'and'
    }

    /** Updates the token gating settings */
    updateSettings(data) {

        console.debug('[Token Gating] Panel settings updated: ', data)

        if(data.restrictDate != null) {
            window.parent.postMessage({action: 'update-settings', restrictDate: data.restrictDate}, '*');
            this.setState({restrictDate: data.restrictDate})
        }
        else if(data.dateFrom) {
            window.parent.postMessage({action: 'update-settings', dateFrom: data.dateFrom}, '*');
            this.setState({dateFrom: data.dateFrom})
        }
        else if(data.dateTo) {
            window.parent.postMessage({action: 'update-settings', dateTo: data.dateTo}, '*');
            this.setState({dateTo: data.dateTo})
        }
        else if(data.multiCondition) {
            window.parent.postMessage({action: 'update-settings', multiCondition: data.multiCondition}, '*');
            this.setState({multiCondition: data.multiCondition})
        }
    }

    /** Called when date field is changed */
    onDateTimeChange(data) {
        console.log(data.target.value)
        
    }

    render = () => <>

        <div style={{display: 'flex', marginTop: 8, marginLeft: 8, alignItems: 'center'}}>
            <img src={require('./settings.svg')} width={20} height={20} />
            <div style={{padding: '0px 5px'}}/>
            <div style={{fontSize: 22, color: '#868E96', fontWeight: 400, fontStyle: 'normal'}}>Settings</div>
        </div>

        <Field name='Restrict Time / Date' help='Restrict Token Gating to specific date and time range.'>
            <Checkbox on={this.state.restrictDate} onToggle={v => this.updateSettings({restrictDate: v})} />
        </Field>

        {this.state.restrictDate ? <>
            <Field style={{width: '60%'}} name='Time / Date From (optional)' help='Time / Date from which tokens are active'>
                <DateTimePicker value={this.state.dateFrom} onValue={v => this.updateSettings({dateFrom: v.target.value})}/>
            </Field>

            <Field style={{width: '60%'}} name='Time / Date To (optional)' help='Time / Date to which tokens will be active'>
                <DateTimePicker value={this.state.dateTo} onValue={v => this.updateSettings({dateTo: v.target.value})}/>
            </Field>
        </>: null}

        <Field name='Multi-Token Condition' help='Decides wether any or all tokens are needed to grant access'>
            <Select value={this.state.multiCondition} onValue={v => this.updateSettings({multiCondition: v })} items={['And', 'Or']} values={['and', 'or']} />
        </Field>
        
        <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

    </>

}