import React from 'react';
import {Input, Field, Select} from './panel-components'

export default class Settings extends React.PureComponent {
     
    state = {
        // TODO: Passing in settings via props is crashing panel on open (dateFrom is null?)
        dateFrom: /*this.props.settings.dateFrom ||*/ '',
        dateTo: /*this.props.settings.dateTo ||*/ '',
        multiCondition: /*this.props.settings.multiCondition ||*/ 'and'

    }

    updateSettings(data) {
        if(data.dateFrom) {
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

    render = () => <>

        <div style={{display: 'flex', marginTop: 8, marginLeft: 8, alignItems: 'center'}}>
            <img src={require('./settings.svg')} width={20} height={20} />
            <div style={{padding: '0px 5px'}}/>
            <div style={{fontSize: 22, color: '#868E96', fontFamily: 'Inter', fontWeight: 400, fontStyle: 'normal'}}>Settings</div>
        </div>

        <Field name='Time / Date From (optional)' help='Time / Date from which tokens are active'>
            <Input type='text' value={this.state.dateFrom ?? ''} onValue={v => this.updateSettings({dateFrom: v})} help='Time / Date from which tokens are active' />
        </Field>

        <Field name='Time / Date To (optional)' help='Time / Date to which tokens will be active'>
            <Input type='text' value={this.state.dateTo ?? ''} onValue={v => this.updateSettings({dateTo: v})} help='Time / Date to which tokens will be active' />
        </Field>

        <Field name='Multi-Token Condition' help='Decides wether any or all tokens are needed to grant access'>
            <Select value={this.state.multiCondition} onValue={v => this.updateSettings({multiCondition: v })} items={['And', 'Or']} values={['and', 'or']} />
        </Field>
        
        <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

    </>

}