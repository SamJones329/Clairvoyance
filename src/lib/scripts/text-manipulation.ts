function toCamelCase(input: string) {
    if(input.length === 0) return "";
    const words = input.split(' ')
    let firstWord = words[0]
    if(firstWord.toUpperCase() !== firstWord || firstWord.length === 1) {
        firstWord = firstWord[0].toLowerCase() + firstWord.slice(1);
    }
    words[0] = firstWord;
    
    for(let i = 1; i < words.length; i++) {
        if(words[i] !== words[i].toUpperCase()) {
            words[i] = words[i][0].toLowerCase() + words[i].slice(1);
        }
    }

    return words.join('')
}

export {toCamelCase}