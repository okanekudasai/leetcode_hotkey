
let lang_parser = (s) => {
    let inputString = s;
    let resultString = '';

    for (let i = 0; i < inputString.length; i++) {
        if (isNaN(inputString[i]) && inputString[i] !== ' ') {
            resultString += inputString[i];
        }
    }

    return resultString;
}