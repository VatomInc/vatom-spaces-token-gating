import React from 'react';
import {Input, Field, Select, Button, LabeledSwitch, DateTimePicker, Input2} from './panel-components'
import { v4 as uuidv4 } from 'uuid'
import Swal from 'sweetalert2';
import {ethers} from 'ethers'

export default class Token extends React.PureComponent {
   
    /** Updates token field */
    updateToken(data) {
        
        try {
            let message = {action: 'update-token', id: this.props.token.id, properties: data}
            window.parent.postMessage(message, '*');
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

    /** Adds trait to token */
    addTrait() {
        let id = uuidv4()
        let name = `Trait ${this.props.token.traits.length + 1}`

        let traits = this.props.token.traits
        traits.push({id: id, name: name, key: null, value: null})
        this.updateToken({traits: traits})
    }

    /** Deletes trait from token */
    deleteTrait(id){
        let traits = this.props.token.traits.filter(t => t.id != id)
        this.updateToken({traits: traits})
    }

    /** Updates trait */
    updateTrait(trait) {
        let traits = this.props.token.traits
        let index = traits.findIndex(t => t.id == trait.id);
        
        if(trait.key) traits[index].key = trait.key
        if(trait.value) traits[index].value = trait.value
       
        this.updateToken({traits: traits})
    }

    /** Validates if given contract address exists */
    validateContractAddress(address) {

        if(address.length == 0 || address == ''){
            this.updateToken({contractAddress: null})
            this.updateToken({validAddress: null})
        }

        console.debug('[Token Gating] Validating contract address')

        let isValid = ethers.utils.isAddress(address)

        if(isValid){
            console.debug("[Token Gating] Contract Address is valid")
            this.updateToken({contractAddress: address})
            this.updateToken({validAddress: true})
        }
        else{
            console.error("[Token Gating] Contract Address is invalid")
            Swal.fire('Invalid Contract Address', 'You have entered an invalid contract address for the NFT collections you wish to use as token keys. Please enter the correct contract address in the field below.', 'error')
            this.updateToken({contractAddress: address})
            this.updateToken({validAddress: false})
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
                <div style={{display: 'inline-block', fontSize: 22, color: '#868E96', fontWeight: 400, fontStyle: 'normal'}}>{this.props.token.name}</div>
            </div>
            
            <div style={{marginTop: 20}}>
                
                <Field name='Network' help='Network that NFT belongs to.'>
                    <Select value={this.props.token.network} onValue={v => this.updateToken({network: v })} items={['Vatom', 'Ethereum']} values={['vatom', 'ethereum']} />
                </Field>

                {this.props.token.network == 'vatom' ? <>

                    {/*TODO: Add link to "learn more here" */}
                    <LabeledSwitch onToggle={e => this.updateToken({type: this.props.token.type == 'nft' ? 'coin' : 'nft'})} labelLeft={"Smart NFT"} labelRight={"Coins"} direction={this.props.token.type == 'nft' ? 'left' : 'right'} 
                    help={this.props.token.type == 'nft' ? 'Choosing this option allows you to restrict access to this space/zone for the most loyal users of your business. Set the minimum number of coins the attendee needs to hold for entry. <br> Learn more here' : null}/>

                    <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                    {this.props.token.type == 'nft' ? <>
                        <Field name='Campaign ID' help='The Campaign ID for the Vatom Smart NFT collection you wish to use as token keys.'>
                            <Input type='text' value={this.props.token.campaignID ?? ''} onValue={v => this.updateToken({campaignID: v})} help='Enter the Campaign ID for the Vatom Smart NFT collection you wish to use as token keys.' />
                        </Field>
                        <Field name='Object ID' help='The Object ID for the Vatom Smart NFT collection you wish to use as token keys.'>
                            <Input type='text' value={this.props.token.objectID ?? ''} onValue={v => this.updateToken({objectID: v})} help='Enter the Object ID for the Vatom Smart NFT collection you wish to use as token keys.' />
                        </Field>
                    </> : 
                    <>
                        <Field name='Business ID (optional)' help='The Business ID of the Vatom coin collection that you wish to use as coin token keys.'>
                            <Input type='text' value={this.props.token.businessID ?? ''} onValue={v => this.updateToken({businessID: v})} help='Enter the Business ID of the Vatom coin collection that you wish to use as coin token keys.' />
                        </Field>
                    </>}

                </> : <>
                
                    <Field name='Contract Address' help='Contract address for the NFT collection you wish to use as token keys.' />
                    <Input2 cutOff={true} cutOffLength={30} type='text' icon={this.props.token.validAddress != null ? this.props.token.validAddress ? require('./valid.svg') : require('./invalid.svg') : null} value={this.props.token.contractAddress ?? ''} onValue={v => this.validateContractAddress(v)} help={'Enter the contract address for the NFT collection you wish to use as token keys.'}/>

                    {/* <Field style={{width: '60%'}} name='Held Since (optional)' help='Date from which this token must have been first held'>
                        <DateTimePicker disabled={true} value={this.props.token.heldSince} onValue={v => this.updateSettings({heldSince: v.target.value})} />
                    </Field> */}
                
                </>}

                <Field name={`Minimum ${this.props.token.network == 'ethereum' ? 'quantity' : this.props.token.type == 'nft' ? "tokens" : "coins"} held`} help='The minimum amount of token keys required to grant access.'>
                    <Input type='number' value={this.props.token.minAmountHeld ?? 1} onValue={v => this.updateToken({minAmountHeld: v})} help='Enter the minimum amount of token keys required to grant access.' />
                </Field>

                <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                <Field name='Zone ID' help='The Zone ID of the region that this token should block. Converts token to region blocking token.'>
                    <Input type='text' value={this.props.token.zoneID ?? ''} onValue={v => this.updateToken({zoneID: v})} help='Enter the Zone ID for the region that this token will gate.' />
                </Field>

                {/* <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} /> */}

                <Field name={`${this.props.token.zoneID ? 'Region' : 'Space'} Denial Message`} help={`The message you wish to show to users when they are denied access to the ${this.props.token.zoneID ? 'Region' : 'Space'}. If left empty, will use default message.`}/>
                <Input2 type='textarea' value={this.props.token.denialMessage ?? ''} onValue={v => this.updateToken({denialMessage: v})} help={`Enter the message you wish to show to users when they are denied access to the ${this.props.token.zoneID ? 'Region' : 'Space'} `}/>

                {this.props.token.type != 'coin' ? <>
                
                    <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                    <div style={{fontSize: 16, color: '#868E96', marginLeft: 8}}>Traits (Optional)</div>

                    <Field name='Multi-Trait Condition' help='Decides wether any or all traits are needed'>
                        <Select disabled={this.props.token.traits.length <= 1} value={this.props.token.multiTraitCondition} onValue={v => this.updateToken({multiTraitCondition: v})} items={['And', 'Or']} values={['and', 'or']} />
                    </Field>

                    <div style={{padding: this.props.token.traits.length > 0 ? "10px 0px" : '5px 0px'}}/>

                    {this.props.token.traits.map(trait => <>
                    
                        <Field style={{display: 'flex', width: '70%'}} name={trait.name} help={`A trait that a user's token must have in order to grant access`}>
                            <Input style={{width: 65}} type='text' value={trait.key} onValue={v => this.updateTrait({id: trait.id, key: v})} help={`Enter the key of the token trait`}/>
                            <Input style={{width: 65}} type='text' value={trait.value} onValue={v => this.updateTrait({id: trait.id, value: v})} help={`Enter the value of the token trait`}/>
                            <img style={{cursor: 'pointer', transform: 'translateY(5px)'}} width={16} height={16} src={require('./trash.svg')} onClick={e => this.deleteTrait(trait.id)}/>
                        </Field>
                    
                    </>)}

                    <div style={{marginTop: this.props.token.traits.length > 0 ? 10 : 0, marginRight: 5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
                        <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}} onClick={e => this.addTrait()}>
                            <div style={{fontSize: 12, color: '#868E96'}}>Add Trait</div>
                            <div style={{padding: '0px 5px'}}/>
                            <div style={{fontSize: 25, color: '#868E96', transform: 'translateY(-2px)'}}>+</div>
                        </div>
                    </div>
                
                </> : null}
               
                <Button title='Delete Token' onClick={e => this.deleteToken()} style={{color: '#FFFFFF', backgroundColor: '#fa525299', borderRadius: 3, height: 30}}/>
                
                <div style={{padding: 3}}/>

            </div>

        </div>

    </>
}