const copyTextElement = (textElement: HTMLInputElement) => {
    textElement.select();
    textElement.setSelectionRange(0, textElement.value.length); // for mobile
    navigator.clipboard.writeText(textElement.value);
}

const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
}

export {copyText, copyTextElement}