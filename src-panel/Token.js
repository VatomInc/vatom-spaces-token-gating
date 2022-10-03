import React from 'react';
import {Input, Field, Select, Button, LabeledSwitch, DateTimePicker} from './panel-components'
import { v4 as uuidv4 } from 'uuid'
import algoliasearch from 'algoliasearch'
import Swal from 'sweetalert2';
import constants from '../src/constants'

export default class Token extends React.PureComponent {

    // Relevant fields for algolia search
    hostName = window.location.host
    isDevDomain = this.hostName.includes(constants.domains.dev)
    isTestDomain = this.hostName.includes(constants.domains.test)
    algoliaAppID = this.isTestDomain ? constants.algolia.appId.dev : this.isDevDomain ? constants.algolia.appId.dev : constants.algolia.appId.prod
    algoliaKey = this.isTestDomain ? constants.algolia.key.dev : this.isDevDomain ? constants.algolia.key.dev : constants.algolia.key.prod
 
     
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
        contractAddress: this.props.token.contractAddress || null,
        validAddress: this.props.token.validAddress || null,
        heldSince: this.props.token.heldSince || null,
        multiTraitCondition: this.props.token.multiTraitCondition || 'and',
        traits: this.props.token.traits || []
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

    /** Adds trait to token */
    addTrait() {
        let id = uuidv4()
        let name = `Trait ${this.state.traits.length + 1}`

        let traits = this.state.traits
        traits.push({id: id, name: name, key: null, value: null})
        this.updateToken({traits: traits})
    }

    /** Deletes trait from token */
    deleteTrait(id){
        let traits = this.state.traits.filter(t => t.id != id)
        this.updateToken({traits: traits})
    }

    // TODO: Get contract address validation working
    /** Validates if given contract address exists */
    async validateContractAddress(address) {

        console.debug('[Token Gating] Validating contract address')

        // console.log('[Token Gating] AlgoliaAppID: ', this.algoliaAppID)
        // console.log('[Token Gating] AlgoliaKey: ', this.algoliaKey)

        const client = await algoliasearch(this.algoliaAppID, this.algoliaKey)

        let userIndex = client.initIndex("users")

        userIndex.search(address, {"facetFilters": [["identities.type:eth"]]})

        console.log("UserIndex: ", userIndex)
        
        // If invalid, show popup
        if(!userIndex) {
            console.error("[Token Gating] Contract Address is invalid")
            Swal.fire('Invalid Contract Address', 'You have entered an invalid contract address for the NFT collections you wish to use as token keys. Please enter the correct contract address in the field below.', 'error')
            this.updateToken({contractAddress: address})
            this.updateToken({validAddress: false})
            return
        }

        // Update Token
        console.debug("[Token Gating] Contract Address is valid")
        this.updateToken({contractAddress: address})
        this.updateToken({validAddress: true})
    }
    
    /** Render */
    render = () => 
    <>
    
        <div style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, marginTop: 18}}>
                        
            <div style={{padding: 5}}/>

            <div style={{display: 'flex', marginLeft: 8, alignItems: 'center'}}>
                <img src={require('./star.svg')} width={20} height={20} />
                <div style={{padding: '0px 5px'}}/>
                <div style={{display: 'inline-block', fontSize: 22, color: '#868E96', fontWeight: 400, fontStyle: 'normal'}}>{this.state.name}</div>
            </div>
            
            <div style={{marginTop: 20}}>
                
                <Field name='Network' help='Network that NFT belongs to.'>
                    <Select value={this.state.network} onValue={v => this.updateToken({network: v })} items={['Vatom', 'Ethereum']} values={['vatom', 'ethereum']} />
                </Field>

                {this.state.network == 'vatom' ? <>

                    <LabeledSwitch onToggle={e => this.updateToken({type: this.state.type == 'nft' ? 'coin' : 'nft'})} labelLeft={"Smart NFT"} labelRight={"Coins"} direction={this.state.type == 'nft' ? 'left' : 'right'}/>

                    <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                    {this.state.type == 'nft' ? <>
                        <Field name='Campaign ID' help='The Campaign ID for the Vatom Smart NFT collection you wish to use as token keys.'>
                            <Input type='text' value={this.state.campaignID ?? ''} onValue={v => this.updateToken({campaignID: v})} help='Enter the Campaign ID for the Vatom Smart NFT collection you wish to use as token keys.' />
                        </Field>
                        <Field name='Object ID' help='The Object ID for the Vatom Smart NFT collection you wish to use as token keys.'>
                            <Input type='text' value={this.state.objectID ?? ''} onValue={v => this.updateToken({objectID: v})} help='Enter the Object ID for the Vatom Smart NFT collection you wish to use as token keys.' />
                        </Field>
                    </> : 
                    <>
                        <Field name='Business ID (optional)' help='The Business ID of the Vatom coin collection that you wish to use as coin token keys.'>
                            <Input type='text' value={this.state.businessID ?? ''} onValue={v => this.updateToken({businessID: v})} help='Enter the Business ID of the Vatom coin collection that you wish to use as coin token keys.' />
                        </Field>
                    </>}

                </> : <>
                
                    <Field name='Contract Address' help='Contract address for the NFT collection you wish to use as token keys.' />
                    <Input style={{marginLeft: 10, marginBottom: 5}} cutOff={true} cutOffLength={30} type='text' icon={this.state.validAddress != null ? this.state.validAddress ? require('./valid.svg') : require('./invalid.svg') : null} value={this.state.contractAddress ?? ''} onValue={v => this.validateContractAddress(v)} help={'Enter the contract address for the NFT collection you wish to use as token keys.'}/>

                    {/* <Field style={{width: '60%'}} name='Held Since (optional)' help='Date from which this token must have been first held'>
                        <DateTimePicker disabled={true} value={this.state.heldSince} onValue={v => this.updateSettings({heldSince: v.target.value})} />
                    </Field> */}
                
                </>}

                <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />
                
                <Field name='Zone ID' help='The Zone ID of the region that this token should block. Converts token to region blocking token.'>
                    <Input type='text' value={this.state.zoneID ?? ''} onValue={v => this.updateToken({zoneID: v})} help='Enter the Zone ID for the region that this token will gate.' />
                </Field>

                <Field name={`Minimum ${this.state.network == 'ethereum' ? 'quantity' : this.state.type == 'nft' ? "tokens" : "coins"} held`} help='The minimum amount of token keys required to grant access.'>
                    <Input type='number' value={this.state.minAmountHeld ?? 1} onValue={v => this.updateToken({minAmountHeld: v})} help='Enter the minimum amount of token keys required to grant access.' />
                </Field>

                {this.state.type != 'coin' ? <>
                
                    <hr style={{ width: 'calc(100% - 40px)', color: 'rgb(255, 255, 255)', opacity: 0.2 }} />

                    <div style={{fontSize: 16, color: '#868E96', marginLeft: 8}}>Traits (Optional)</div>

                    <Field name='Multi-Trait Condition' help='Decides wether any or all traits are needed'>
                        <Select disabled={this.state.traits.length <= 1} value={this.state.multiTraitCondition} onValue={v => this.updateToken({multiTraitCondition: v})} items={['And', 'Or']} values={['and', 'or']} />
                    </Field>

                    <div style={{padding: '10px 0px'}}/>

                    {this.state.traits.map(trait => <>
                    
                        <Field style={{display: 'flex', width: '50%'}} name={trait.name} help={`A trait that a user's token must have in order to grant access`}>
                            <Input style={{padding: '5px 23px'}} type='text' value={trait.key} onValue={v => this.updateToken({})} help={`Enter the key of the required trait for this token`}/>
                            <Input style={{padding: '5px 23px'}} type='text' value={trait.value} onValue={v => this.updateToken({})} help={`Enter the value of the required trait for this token`}/>
                            <img style={{cursor: 'pointer', transform: 'translateY(5px)'}} width={16} height={16} src={require('./trash.svg')} onClick={e => this.deleteTrait(trait.id)}/>
                        </Field>
                    
                    </>)}

                    <div style={{marginTop: 10, marginRight: 5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
                        <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}} onClick={e => this.addTrait()}>
                            <div style={{fontSize: 12, color: '#868E96'}}>Add Another Trait</div>
                            <div style={{padding: '0px 5px'}}/>
                            <div style={{fontSize: 25, color: '#868E96', transform: 'translateY(-2px)'}}>+</div>
                        </div>
                    </div>
                
                </> : null}
               
                <Button title='Delete Token' onClick={e => this.deleteToken()} style={{color: '#FFFFFF', backgroundColor: '#fa525299', borderRadius: 3, height: 30}}/>
                
                <div style={{padding: 3}}/>

            </div>

            {/* <div style={{padding: 5}}/> */}

        </div>

    </>
}