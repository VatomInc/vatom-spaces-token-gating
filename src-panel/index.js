import React from 'react';
import { createRoot } from 'react-dom/client'
import TokenList from './TokenList'
import Settings from './Settings'

/** Main app */
class App extends React.PureComponent {

    state = {
        tokens: null,
        settings: null
    }

    componentDidMount() {

        window.addEventListener('message', e => {
            
            // console.debug("[Token Gating] Panel onMessage: ", e)
            
            // If plugin is sending us reference to existing tokens
            if(e.data.action == 'send-tokens') {
                console.debug("[Token Gating] Panel received tokens")
                this.setState({tokens: e.data.tokens})
            }

            // If plugins is sending us reference to existing settings
            if(e.data.action == 'send-settings') {
                console.debug("[Token Gating] Panel received settings")
                this.setState({settings: e.data.settings})
            }

            if(e.data.action == 'update-panel') {
                console.debug("[Token Gating] Updating Panel")
                this.forceUpdate()
            }
        })

        // Send message to plugin to fetch existing tokens and settings
        window.parent.postMessage({action: 'get-tokens'}, '*')
        window.parent.postMessage({action: 'get-settings'}, '*')

    }

    /** Render */
    render = () => <>

        {this.state.settings ? <Settings settings={this.state.settings}/> : null}
        {this.state.tokens ? <TokenList tokens={this.state.tokens}/> : null}
     
    </>

}

// Render app
let appContainer = document.createElement('div')
appContainer.id = 'react-app'
appContainer.style.fontFamily = "Inter, Verdana, Arial";
document.body.appendChild(appContainer)
let root = createRoot(appContainer)
root.render(<App />)