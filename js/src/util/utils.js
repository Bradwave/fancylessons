/**
 * Sets a variable to a default value if undefined.
 * @param {*} variable Variable to check.
 * @param {*} defaultValue Default value.
 * @returns Returns the default value if the variable is undefined, hte variable itself if not.
 */
const toDefaultIfUndefined = (variable, defaultValue) => {
    return (typeof variable === 'undefined' ? defaultValue : variable);
}

/**
 * Constrains a variable into a [min, max] interval.
 * @param {Number} value Input value.
 * @param {Number} min Min value.
 * @param {Number} max Max value.
 * @returns 
 */
const constrain = (value, min, max) => {
    return value > max ? max : (value < min ? min : value);
}

/**
 * Converts the input value to float and sets the input box value.
 * @param {*} inputBox Input box.
 * @param {Array} options Options.
 * @returns Returns the float value of the input box.
 */
const getInputNumber = (inputBox, options = {
    float: false,
    min: -Infinity,
    max: Infinity
}) => {
    let newValue = constrain(
        options.float ? parseFloat(inputBox.value) : parseInt(inputBox.value),
        options.min,
        options.max
    );
    inputBox.value = newValue;
    return newValue;
}

/**
 * Gets a css variable, given the name.
 * @param {String} variableName Name of the CSS variable.
 * @param {*} Options Options (forceName: true if the variable name must be used unaltered).
 * @returns 
 */
const getCssVariable = (variableName, options = {
    forceName: false
}) => {
    // Adds -- in front of the variable name if missing and the variable name can be altered
    if (!options.forceName) variableName = variableName.startsWith("--") ? variableName : "--" + variableName;
    // Gets the variable
    let variableValue = getComputedStyle(document.documentElement).getPropertyValue(variableName);
    return variableValue;
}