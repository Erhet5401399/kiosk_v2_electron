import { useState, useEffect } from 'react';
import type { KeyboardTarget } from '../types';

export function useRegistration() {
  const [registerPrefix, setRegisterPrefix] = useState('');
  const [registerSuffix, setRegisterSuffix] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardTarget>('prefix');

  useEffect(() => {
    setRegisterNumber(registerPrefix + registerSuffix);
  }, [registerPrefix, registerSuffix]);

  const handleKeyClick = (key: string) => {
    if (keyboardTarget === 'prefix') {
      if (registerPrefix.length < 2 && isNaN(Number(key))) {
        setRegisterPrefix((prev) => prev + key);
        if (registerPrefix.length === 1) setKeyboardTarget('suffix');
      }
    } else {
      if (registerSuffix.length < 8 && !isNaN(Number(key))) {
        setRegisterSuffix((prev) => prev + key);
      }
    }
  };

  const handleBackspace = () => {
    if (keyboardTarget === 'suffix' && registerSuffix.length > 0) {
      setRegisterSuffix((prev) => prev.slice(0, -1));
    } else if (keyboardTarget === 'suffix' && registerSuffix.length === 0) {
      setKeyboardTarget('prefix');
      setRegisterPrefix((prev) => prev.slice(0, -1));
    } else if (keyboardTarget === 'prefix') {
      setRegisterPrefix((prev) => prev.slice(0, -1));
    }
  };

  const reset = () => {
    setRegisterPrefix('');
    setRegisterSuffix('');
    setRegisterNumber('');
    setShowKeyboard(false);
    setKeyboardTarget('prefix');
  };

  return {
    registerPrefix,
    registerSuffix,
    registerNumber,
    showKeyboard,
    keyboardTarget,
    setShowKeyboard,
    setKeyboardTarget,
    handleKeyClick,
    handleBackspace,
    reset,
  };
}
