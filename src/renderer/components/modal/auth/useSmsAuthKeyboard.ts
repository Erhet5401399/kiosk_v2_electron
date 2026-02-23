import { useState } from "react";

export type SmsField = "registerNumber" | "phoneNumber" | "smsCode";
export type KeyboardMode = "alphanumeric" | "numeric";

export function useSmsAuthKeyboard() {
  const [registerNumber, setRegisterNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [keyboardTarget, setKeyboardTarget] = useState<SmsField | null>(null);
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("alphanumeric");
  const [keyboardMaxLength, setKeyboardMaxLength] = useState<number | null>(null);

  const openKeyboard = (
    target: SmsField,
    options: { mode: KeyboardMode; maxLength: number },
  ) => {
    setKeyboardTarget(target);
    setKeyboardMode(options.mode);
    setKeyboardMaxLength(options.maxLength);
  };

  const closeKeyboard = () => {
    setKeyboardTarget(null);
    setKeyboardMaxLength(null);
  };

  const focusRegister = () =>
    openKeyboard("registerNumber", { mode: "alphanumeric", maxLength: 10 });
  const focusPhone = () =>
    openKeyboard("phoneNumber", { mode: "numeric", maxLength: 8 });
  const focusSmsCode = () =>
    openKeyboard("smsCode", { mode: "numeric", maxLength: 6 });

  const appendKeyboardValue = (key: string) => {
    if (!keyboardTarget) return;

    if (keyboardTarget === "registerNumber") {
      if (
        typeof keyboardMaxLength === "number" &&
        registerNumber.length >= keyboardMaxLength
      ) {
        return;
      }
      setRegisterNumber((prev) => `${prev}${key}`.toUpperCase());
      return;
    }

    if (!/^\d$/.test(key)) return;

    if (keyboardTarget === "phoneNumber") {
      if (
        typeof keyboardMaxLength === "number" &&
        phoneNumber.length >= keyboardMaxLength
      ) {
        return;
      }
      setPhoneNumber((prev) => `${prev}${key}`);
      return;
    }

    if (typeof keyboardMaxLength === "number" && smsCode.length >= keyboardMaxLength) {
      return;
    }
    setSmsCode((prev) => `${prev}${key}`);
  };

  const backspaceKeyboardValue = () => {
    if (!keyboardTarget) return;
    if (keyboardTarget === "registerNumber") {
      setRegisterNumber((prev) => prev.slice(0, -1));
      return;
    }
    if (keyboardTarget === "phoneNumber") {
      setPhoneNumber((prev) => prev.slice(0, -1));
      return;
    }
    setSmsCode((prev) => prev.slice(0, -1));
  };

  return {
    registerNumber,
    phoneNumber,
    smsCode,
    keyboardTarget,
    keyboardMode,
    setSmsCode,
    closeKeyboard,
    focusRegister,
    focusPhone,
    focusSmsCode,
    appendKeyboardValue,
    backspaceKeyboardValue,
  };
}
