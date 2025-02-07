const superscriptMap: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
};

/**
 * Converts an exponent to a Unicode superscript.
 */
export function toSuperscript(num: number): string {
    return num
        .toString()
        .split('')
        .map((char) => superscriptMap[char] || char)
        .join('');
}
