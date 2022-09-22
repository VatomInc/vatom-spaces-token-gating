import React from 'react'
import DOMPurify from 'dompurify'
import Swal from 'sweetalert2'

/**
 * A text input field.
 * @param {object} props The input field properties.
 * @param {string} props.value The current value.
 * @param {string} props.help The text to display in the alert.
 * @param {Function} props.onValue Function to call when the value changes. First argument is the new value.
 * @param {string=} props.type Optional. Type of input to display. Default is 'textarea'.
 * @param {boolean=} props.disabled Optional. `true` if input is disabled, `false` otherwise. Default is `false`.
 */
 export const Input = props => {

    const validTypes = ['text', 'textarea', 'number', 'password']
    let inputType = props.type ?? 'textarea'
    const shouldRound = inputType === 'number'

    if (!validTypes.includes(inputType)) {
        inputType = 'textarea'
    }

    // Show text prompt
    if (inputType === 'number' || inputType === 'password') {
        inputType = 'text'
    }

    // Check if this input is clickable
    const isClickable = props.onValue && !props.disabled

    // Used to obscure the password
    const hidePassword = password => {
        return password.replace(/./g, '*')
    }

    // Create edit function
    const edit = async e => {
        // Stop if no value event
        if (!isClickable) {
            return
        }

        // Ask user for the new value
        const { value } = await Swal.fire({
            title: "Edit Field",
            html: props.help,
            input: inputType,
            inputValue: props.value ?? ''
        })

        // Check if changed
        if (value == null || value == props.value) {
            return
        }

        // Notify updated
        props.onValue(value)
    }

    // Gets the value to display to the end user
    const getValue = () => {
        // No current value
        if (props.value == null || props.value.length < 1) {
            return '-'
        }

        // We should round the number given
        if (shouldRound) {
            return minimizeDecimals(parseFloat(props.value))
        }

        // We should hide the text we display (if it's a password)
        if (props.type === 'password') {
            return hidePassword(props.value)
        }

        // Default to just showing the value
        return props.value || '-'
    }

    // Render UI
    return <div onClick={edit} style={{ backgroundColor: 'rgba(0, 0, 0, 0.25', opacity: props.disabled ? 0.45 : 1, borderRadius: 4, padding: '5px 10px', marginRight: 10, fontSize: 12, color: '#FFFFFF', wordBreak: 'break-word', lineHeight: '1.4', cursor: isClickable ? 'pointer' : 'default', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'hidden', userSelect: 'text', WebkitUserSelect: 'text' }}>
        { getValue() }
    </div>

}

/**
 * A field component, with a label on the left.
 * @param {object} props The field properties.
 * @param {string} props.name The name to display.
 * @param {string} props.help The text to display in the alert.
 * @param {string=} props.otherWidth Width of the field after the given name. Default is "40%".
 * @param {object[]} props.children Children components.
 */
 export const Field = props => {

    // On help click
    function onHelp() {

        // Sanitise HTML input so it's safe and has no XSS script hacks
        let sanitisedHTML = DOMPurify.sanitize(props.help)

        // Show alert
        Swal.fire({
            title: props.name,
            html: sanitisedHTML,
            icon: 'info'
        })

    }

    // Render UI
    return <div style={{ display: 'flex', position: 'relative', marginTop: 4 }}>
        <div style={{ display: 'flex', flex: '1 1 auto', height: 'fit-content', alignItems: 'center' }}>
            <div style={{ flex: '1 1 auto', padding: '7px 0px 7px 10px', color: '#FFFFFF', fontSize: 13 }}>
                { props.name }
            </div>

            { props.help
                ? <img src={require('./help.svg')} onClick={onHelp} style={{ flex: '0 0 auto', width: 16, height: 16, margin: '0 6px', cursor: 'pointer' }} />
                : null
            }
        </div>

        <div style={{ flex: '0 0 auto', width: props.name ? (props.otherWidth || '40%') : '100%', fontSize: 13, alignSelf: 'center' }}>
            { props.children }
        </div>
    </div>

}

/**
 * A simple button.
 * @param {object} props The button properties.
 * @param {string} props.title The title of the button.
 * @param {boolean} props.selected `true` to highlight this section, `false` otherwise.
 * @param {boolean} props.disabled `true` to disable the button, `false` otherwise.
 * @param {Function} props.onClick Function to execute when button is clicked.
 * @param {any=} props.icon Optional. Icon to display in button.
 * @param {React.CSSProperties=} props.style Optional. Additional styling for the button.
 */
 export const Button = props => <div onClick={props.disabled ? null : props.onClick} style={Object.assign({
    margin: '10px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: props.selected ? constants.colors.blue : 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    cursor: props.disabled ? 'default' : 'pointer',
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: props.disabled ? 0.5 : 1,
    flexShrink: 0,
    fontSize: 16
}, props.style)}>

    {/* Show icon (if exists) */}
    { props.icon
        ? <img src={props.icon} style={{ display: 'inline', height: 26, marginRight: 15 }} />
        : null
    }

    {/* Title */}
    { props.title }

</div>

/**
 * A dropdown selection component.
 * @param {object} props The selection properties.
 * @param {string} props.value The current value.
 * @param {string[]} props.items Items to add to the list.
 * @param {string[]} props.values Values to use for list items. Must match the length of `items`.
 * @param {Function} props.onValue Function to call with the new value.
 * @param {React.CSSProperties=} props.style Optional. Additional styling to apply to the select component.
 */
 export const Select = props => <div style={Object.assign({ display: 'flex', position: 'relative', alignItems: 'center' }, props.style)}>
 <select disabled={!!props.disabled} value={typeof props.value == 'number' ? props.value ?? '' : props.value || ''} onChange={e => props.onValue(e.target.value)} style={{ WebkitAppearance: 'none', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 4, border: 'none', padding: '5px 10px', marginRight: 10, fontFamily: 'Inter', fontSize: 12, color: Server.dimension.data.fieldColor, wordBreak: 'break-word', lineHeight: '1.4', cursor: 'pointer', width: 'calc(100% - 10px)' }}>
     { (props.items || []).map((name, idx) => {
         // Get details
         let value = props.values && props.values[idx];
         if (typeof value == "undefined") {
             value = name;
         }

         return <option key={idx} value={value}>{ name }</option>
       })
     }
 </select>

 <img src={require('./down-arrow.svg')} style={{ position: 'absolute', right: 20, width: 13, height: 13, pointerEvents: 'none' }} />
</div>