import { StreamLanguage } from '@codemirror/language';

// Tokenizer for the NDD Cargo semicolon-delimited TXT layout.
// Each line starts with a 4-digit record-type code followed by semicolon-separated fields.
export const nddTxt = StreamLanguage.define<{ fieldIndex: number }>({
  startState: () => ({ fieldIndex: 0 }),

  token(stream, state) {
    // Reset field counter at the beginning of every line
    if (stream.sol()) {
      state.fieldIndex = 0;
    }

    // Semicolon separator
    if (stream.eat(';')) {
      state.fieldIndex++;
      return 'punctuation';
    }

    // Record-type code: first field, 2-4 digits (e.g. "1000", "4210")
    if (state.fieldIndex === 0 && stream.match(/^\d{2,4}/)) {
      return 'keyword';
    }

    // Numeric values (integers, decimals, and date-like strings like "2020-05-05")
    if (stream.match(/^-?\d[\d.\-]*/)) {
      return 'number';
    }

    // Text value — consume until the next semicolon or end of line
    if (stream.match(/^[^;]+/)) {
      return 'string';
    }

    // Fallback: advance one char so the tokenizer never stalls
    stream.next();
    return null;
  },

  blankLine(state) {
    state.fieldIndex = 0;
  },
});
