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
 * Rounds the number of digits in a given float.
 * @param {Number} number Float whose digits need to be rounded.
 * @param {Number} numberOfDecimalDigits Number of digits.
 * @returns The float with rounded number of digits.
 */
const roundNumberDigit = (number, numberOfDecimalDigits) => {
    return Math.round(number * Math.pow(10, numberOfDecimalDigits)) / Math.pow(10, numberOfDecimalDigits)
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
 * Gets a CSS variable, given the name.
 * @param {String} variableName Name of the CSS variable.
 * @param {*} Options Options (forceName: true if the variable name must be used unaltered, format: output format float/int).
 * @returns The variable value.
 */
const getCssVariable = (variableName, options = {
    forceName: false,
    format: undefined
}) => {
    // Adds -- in front of the variable name if missing and the variable name can be altered
    if (!options.forceName) variableName = variableName.startsWith("--") ? variableName : "--" + variableName;
    // Gets the variable
    let variableValue = getComputedStyle(document.documentElement).getPropertyValue(variableName);
    // Converts to float or integer if needed
    if (options.format == "float") {
        variableValue = parseFloat(variableValue);
    } else if (options.format == "int" || options.format == "integer") {
        variableValue = parseInt(variableValue);
    }
    return variableValue;
}


/**
 * Gets a CSS time or duration variable (in seconds) and converts it into milliseconds.
 * @param {String} variableName Name of the CSS time or duration variable (in seconds);
 * @returns The time or duration stored in the CSS variable in milliseconds.
 */
const getCssTimeInMs = (variableName) => {
    return parseFloat(getCssVariable(variableName)) * 1000;
}