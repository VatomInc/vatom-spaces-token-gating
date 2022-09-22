import React from 'react';
import { createRoot } from 'react-dom/client'
import TokenList from './TokenList'
import Settings from './Settings'

/** Main app */
class App extends React.PureComponent {

    state={tokens: null}

    componentDidMount() {

        window.addEventListener('message', e => {
            
            console.log("[Panel] ", e)
            
            // If plugin is sending us reference to exisiting tokens
            if(e.data.action == 'send-tokens') {
                console.log("[Panel] Received tokens")
                // Set panel's tokens reference to the one received from plugin
                this.setState({tokens: e.data.tokens})
            }

            if(e.data.action == 'update-panel') {
                console.log("[Panel] Update Panel")
                this.forceUpdate()
            }
        })

        // Send message to plugin to fetch existing tokens
        window.parent.postMessage({action: 'get-tokens'}, '*');
    }

    /** Render */
    render = () => <>

        <Settings/>
        {this.state.tokens ? <TokenList tokens={this.state.tokens}/> : null}
     
    </>

}

// Render app
let appContainer = document.createElement('div')
appContainer.id = 'react-app'
document.body.appendChild(appContainer)
let root = createRoot(appContainer)
root.render(<App />)