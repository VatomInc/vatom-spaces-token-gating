import React, { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import Swal from 'sweetalert2'

/**
 * A text input field.
 * @param {object} props The input field properties.
 * @param {string} props.value The current value.
 * @param {string} props.help The text to display in the alert.
 * @param {Function} props.onValue Function to call when the value changes. First argument is the new value.
 * @param {string=} props.type Optional. Type of input to display. Default is 'textarea'.
 * @param {number} props.fontSize Optional. Changes fontsize of text.
 * @param {boolean} props.cutOff Optional. Cuts off text if too long.
 * @param {boolean} props.cutOffLength Optional. Length of text shown before cut off.
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

        // Cut off text after certain length
        if(props.cutOff){
            let value = props.value
            let length = props.cutOffLength || 20
            if(props.value.length > length){
                value = value.slice(0, length) + "..."
            }
            return value
        }

        // Default to just showing the value
        return props.value || '-'
    }

    // Render UI
    return <div onClick={edit} style={Object.assign({ 
            backgroundColor: 'rgba(0, 0, 0, 0.25)', 
            opacity: props.disabled ? 0.45 : 1, 
            borderRadius: 4, 
            padding: '5px 10px', 
            marginRight: 10, 
            fontSize: props.fontSize || 11, 
            color: '#FFFFFF', 
            wordBreak: 'break-word', 
            lineHeight: '1.4', 
            cursor: isClickable ? 'pointer' : 'default', 
            whiteSpace: 'pre-wrap', 
            maxHeight: 200, 
            overflow: 'hidden', 
            userSelect: 'text', 
            WebkitUserSelect: 'text' }, props.style)}>

            { getValue() }

        </div>

}

/**
 * A text input field.
 * @param {object} props The input field properties.
 * @param {string} props.value The current value.
 * @param {string} props.help The text to display in the alert.
 * @param {Function} props.onValue Function to call when the value changes. First argument is the new value.
 * @param {string=} props.type Optional. Type of input to display. Default is 'textarea'.
 * @param {number} props.fontSize Optional. Changes fontsize of text.
 * @param {boolean} props.cutOff Optional. Cuts off text if too long.
 * @param {boolean} props.cutOffLength Optional. Length of text shown before cut off.
 * @param {any=} props.icon Optional. Icon placed at end of input box.
 * @param {boolean=} props.disabled Optional. `true` if input is disabled, `false` otherwise. Default is `false`.
 */
 export const Input2 = props => {

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

        // Cut off text after certain length
        if(props.cutOff){
            let value = props.value
            let length = props.cutOffLength || 30
            if(props.value.length > length){
                value = value.slice(0, length) + "..."
            }
            return value
        }

        // Default to just showing the value
        return props.value || '-'
    }

    // Render UI
    return <div onClick={edit} style={Object.assign({display: 'flex', margin: '5px 10px', padding: '5px 10px', cursor: isClickable ? 'pointer' : 'default', borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.25)'}, props.style)}>
        <div style={{ 
            opacity: props.disabled ? 0.45 : 1, 
            fontSize: props.fontSize || 11, 
            color: '#FFFFFF', 
            wordBreak: 'break-word', 
            lineHeight: '1.4', 
            whiteSpace: 'pre-wrap', 
            maxHeight: 200, 
            overflow: 'hidden', 
            userSelect: 'text', 
            WebkitUserSelect: 'text' }}>

            { getValue() }

        </div>

        {props.icon ? <img src={props.icon} width={15} height={15} style={{marginLeft: 'auto'}} /> : null}

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
            <div style={{ flex: '1 1 auto', padding: '7px 0px 7px 10px', color: '#FFFFFF', fontSize: 12 }}>
                { props.name }
            </div>

            { props.help
                ? <img src={require('./help.svg')} onClick={onHelp} style={{ flex: '0 0 auto', width: 16, height: 16, margin: '0 6px', cursor: 'pointer' }} />
                : null
            }
        </div>

        <div style={Object.assign({ flex: '0 0 auto', width: props.name ? (props.otherWidth || '40%') : '100%', fontSize: 13, alignSelf: 'center' }, props.style)}>
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
 * Displays a button with multiple sections inside it, layed out horizontally.
 * Children must be instances of `<SplitButtonSection />`.
 * @param {object} props The button properties.
 * @param {object[]} props.children Children components (must be instances of `<SplitButtonSection />`).
 * @param {React.CSSProperties=} props.style Additional styling.
 */
export const SplitButton = props => <div style={Object.assign({ display: 'flex', margin: '5px 5px', overflow: 'hidden' }, props.style)}>
    { props.children }
</div>

/**
 * A section within a split button.
 * @param {object} props The button properties.
 * @param {boolean} props.disabled `true` will prevent clicking and grey out the button, `false` otherwise.
 * @param {string} props.title The button text.
 * @param {number} props.height Height of button.
 * @param {string} props.backgroundColor Background Color for button.
 * @param {string} props.color Color for text.
 * @param {Function} props.onClick Function to execute when button is clicked.
 * @param {any=} props.icon Optional. Icon to display in button.
 * @param {React.CSSProperties=} props.style Optional. Additional styling to apply.
 */
 export const SplitButtonSection = props => (
    <div
        onClick={props.disabled ? null : props.onClick}
        style={Object.assign({
            height: props.height ? props.height : 48,
            flex: '1 1 1px',
            margin: 5,
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: props.backgroundColor || 'rgba(255, 255, 255, 0.1)',
            color: props.color || '#FFFFFF',
            fontSize: 16,
            borderRadius: 3,
            cursor: props.disabled ? 'default' : 'pointer',
            opacity: props.disabled ? 0.5 : 1
        }, props.style)}
    >
        { props.icon
            ? <img src={props.icon} style={{ display: 'inline', height: 26, marginRight: props.title ? 5 : 0 }} />
            : null
        }

        { props.title }
    </div>
)

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
    <select disabled={!!props.disabled} value={typeof props.value == 'number' ? props.value ?? '' : props.value || ''} onChange={e => props.onValue(e.target.value)} style={{ WebkitAppearance: 'none', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 4, border: 'none', padding: '5px 10px', marginRight: 10, fontSize: 12, color: '#FFFFFF', wordBreak: 'break-word', lineHeight: '1.4', cursor: 'pointer', width: 'calc(100% - 10px)' }}>
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

const minimizeDecimals = num => Math.round(num * 100) / 100

/**
 * A simple checkbox.
 * @param {object} props The checkbox properties.
 * @param {boolean} props.on `true` to enable, `false` otherwise.
 * @param {boolean} props.disabled `true` if the checkbox is disabled, `false` otherwise.
 * @param {Function} props.onToggle Function to call with the new value on toggle.
 * @param {string} props.backgroundColor Custom backround color value.
 */
 export const Checkbox = props => <div onClick={e => props.disabled ? null : (props.onToggle && props.onToggle(!props.on))} style={{ display: 'inline-block', width: 24, height: 24, cursor: props.disabled ? 'default' : 'pointer', opacity: props.disabled ? 0.45 : 1, backgroundColor: props.backgroundColor ? props.backgroundColor : 'rgba(0, 0, 0, 0.25)', borderRadius: 4, backgroundImage: props.on ? `url(${require('./check.svg')})` : 'none', backgroundPosition: 'center', backgroundSize: '16px 16px', backgroundRepeat: 'no-repeat' }} />

/**
 * A simple checkbox.
 * @param {object} props The switch properties.
 * @param {Function} props.onToggle Function to call when switch is toggled.
 * @param {string} props.backgroundColor Custom background color value.
 * @param {labelLeft} props.labelLeft Left side label
 * @param {labelRight} props.labelRight Right side label
 */
export const LabeledSwitch = props => {

    let switchAmount = 81

    // Called when component is mounted
    useEffect(() => {
        props.direction == 'left' ? setXpos(switchAmount) : setXpos(0)
    }, [xPos]);

    // Called onClick
    function onClick (direction){   
        direction == 'left' ? setXpos(x => x - switchAmount) : setXpos(x => x + switchAmount)
        setStyle({transform: `translateX(${xPos}px)`})
        direction = getOppositeDirection(direction)
        setDirection(direction)

        // Call OnToggle from props
        props.onToggle()
    }

    // Get opposite direction on one given
    const getOppositeDirection = (direction) => {
        if(direction == 'left') return 'right'
        if(direction == 'right') return 'left'
    }

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
    
    // Component fields
    const [direction, setDirection] = useState(props.direction || 'left')
    const [xPos, setXpos] = useState(props.direction == 'left' ? 0 : switchAmount)
    const [style, setStyle] = useState({transform: `translateX(${xPos}px)`});

    return <>
        <div onClick={e => onClick(direction)} style={Object.assign({  
            display: 'flex',
            alignItems: 'center',
            margin: '30px auto',
            width: 160, 
            height: 30, 
            cursor: 'pointer',
            backgroundColor: props.backgroundColor ? props.backgroundColor : '#FFFFFF',
            borderRadius: 40, 
            userSelect: 'none',
            WebkitUserSelect: 'none',
            }, props.style)}>  

            <div style={Object.assign({marginLeft: 1, width: 72, height: 25, transition: 'transform 250ms', backgroundColor: '#FC500E', borderRadius: 40, border: '2px solid #E9ECEF'}, style)} />
            
            <div style={{position: 'absolute'}}>
                <div style={{float: 'left', marginLeft: 10, fontSize: 10, color: direction == 'left' ? '#FFFFFF' : '#3F4A55'}}>{props.labelLeft}</div>
                <div style={{float: 'right', marginLeft: 43, fontSize: 10, color: direction == 'right' ? '#FFFFFF' : '#3F4A55'}}>{props.labelRight}</div>
            </div>  
        
        </div>

        { props.help
                ? <img src={require('./help.svg')} onClick={onHelp} style={{position: 'absolute', width: 16, height: 16, transform: 'translate(235px, -70px)', cursor: 'pointer' }} />
                : null
        }    

    </>
}

/**
 * A simple checkbox.
 * @param {object} props The switch properties.
 * @param {string} props.value The current value
 * @param {Function} props.onChange Function to call when a change is made.
 */
export const DateTimePicker = props => {

    return <>
        <input value={props.value || 'yyyy/mm/dd, --:--'} onChange={props.onValue} disabled={props.disabled} style={{opacity: props.disabled ? 0.45 : 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', colorScheme:'dark', borderRadius: 4, cursor: props.disabled ? 'default' : 'pointer', border: 'none', height: 25}} type={'datetime-local'} required/>
    </>
}
