import React from 'react';
import {Input, Field} from './panel-components'

export default class Settings extends React.PureComponent {
     
    state={
        dateFrom: null,
        dateTo: null
    }

    render = () => <>

        <div style={{display: 'flex', marginTop: 8, marginLeft: 8, alignItems: 'center'}}>
            <img src={require('./settings.svg')} width={20} height={20} />
            <div style={{padding: '0px 5px'}}/>
            <div style={{fontSize: 22, color: '#868E96', fontFamily: 'Inter', fontWeight: 400, fontStyle: 'normal'}}>Settings</div>
        </div>

        <Field name='Time / Date From (optional)' help='Time / Date From'>
            <Input type='text' value={this.state.dateFrom ?? ''} onValue={v => this.setState({dateFrom: v})} help='Vatom ID' />
        </Field>

        <Field name='Time / Date To (optional)' help='Time / Date To'>
            <Input type='text' value={this.state.dateTo ?? ''} onValue={v => this.setState({dateTo: v})} help='Vatom ID' />
        </Field>
        
        <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

    </>

}