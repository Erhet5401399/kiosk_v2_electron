const LETTERS = [
  ['Ф', 'Ц', 'У', 'Ж', 'Э', 'Н', 'Г', 'Ш', 'Ү', 'З', 'К', 'Ъ'],
  ['Й', 'Ы', 'Б', 'Ө', 'А', 'Х', 'Р', 'О', 'Л', 'Д', 'П'],
  ['Я', 'Ч', 'Ё', 'С', 'М', 'И', 'Т', 'Ь', 'В', 'Ю'],
];

const NUMBERS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', ''],
];

interface VirtualKeyboardProps {
  mode?: 'alphanumeric' | 'numeric';
  onKeyClick: (key: string) => void;
  onBackspace: () => void;
  onDone: () => void;
}

export function VirtualKeyboard({
  mode = 'alphanumeric',
  onKeyClick,
  onBackspace,
  onDone,
}: VirtualKeyboardProps) {
  const showLetters = mode !== 'numeric';
  const backspaceIcon = (
    <svg
      className="key-backspace-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 12H7M7 12L12 7M7 12L12 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="virtual-keyboard split-layout">
      <div className="keyboard-main">
        {showLetters && (
          <div className="keyboard-letters">
            {LETTERS.map((row, i) => (
              <div key={i} className="keyboard-row">
                {row.map((key) => (
                  <button key={key} className="key" onClick={() => onKeyClick(key)}>
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="keyboard-row">
              <button className="key ghost" />
              <button className="key backspace" onClick={onBackspace} aria-label="Backspace">
                {backspaceIcon}
              </button>
              <button className="key keyboard-done" onClick={onDone}>
                Хаах
              </button>
            </div>
          </div>
        )}

        <div className={`keyboard-numbers ${showLetters ? '' : 'numbers-full'}`}>
          {NUMBERS.map((row, i) => (
            <div key={i} className="keyboard-row">
              {!showLetters && i === NUMBERS.length - 1 ? (
                <>
                  <button className="key backspace" onClick={onBackspace} aria-label="Backspace">
                    {backspaceIcon}
                  </button>
                  <button className="key number-key" onClick={() => onKeyClick("0")}>
                    0
                  </button>
                  <button className="key keyboard-done" onClick={onDone}>
                    Хаах
                  </button>
                </>
              ) : (
                row.map((key, j) =>
                  key ? (
                    <button key={key} className="key number-key" onClick={() => onKeyClick(key)}>
                      {key}
                    </button>
                  ) : (
                    <div key={`empty-${j}`} className="key-spacer" />
                  ),
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
