import { ipcRenderer } from "electron";

type KeyboardMode = "alphanumeric" | "numeric";

type KeyboardInputMessage = {
  action?: "append" | "backspace" | "done";
  key?: string;
};

let activeEditable: any = null;

const isEditableElement = (node: any): boolean => {
  if (!node) return false;
  const tagName = String(node.tagName || "").toLowerCase();
  if (node.isContentEditable) return true;
  if (tagName === "textarea") return true;
  if (tagName !== "input") return false;

  const inputType = String(node.type || "text").toLowerCase();
  const blocked = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);
  if (blocked.has(inputType)) return false;
  return !node.disabled && !node.readOnly;
};

const detectKeyboardMode = (node: any): KeyboardMode => {
  const inputType = String(node?.type || "").toLowerCase();
  if (["number", "tel", "phone", "pin"].includes(inputType)) {
    return "numeric";
  }
  const inputMode = String(node?.inputMode || "").toLowerCase();
  if (["numeric", "decimal", "tel"].includes(inputMode)) {
    return "numeric";
  }
  return "alphanumeric";
};

const notifyFocus = (node: any) => {
  activeEditable = node;
  ipcRenderer.sendToHost("vk-focus", {
    mode: detectKeyboardMode(node),
  });
};

const notifyBlur = () => {
  activeEditable = null;
  ipcRenderer.sendToHost("vk-blur");
};

const dispatchInputEvents = (node: any) => {
  node.dispatchEvent(new Event("input", { bubbles: true }));
  node.dispatchEvent(new Event("change", { bubbles: true }));
};

const withCurrentEditable = (cb: (node: any) => void) => {
  const focused = (document as any).activeElement;
  const target = isEditableElement(focused) ? focused : activeEditable;
  if (!isEditableElement(target)) return;
  cb(target);
};

window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener(
    "focusin",
    (event: any) => {
      const target = event?.target;
      if (!isEditableElement(target)) return;
      notifyFocus(target);
    },
    true,
  );

  document.addEventListener(
    "focusout",
    () => {
      setTimeout(() => {
        const next = (document as any).activeElement;
        if (isEditableElement(next)) {
          notifyFocus(next);
          return;
        }
        notifyBlur();
      }, 0);
    },
    true,
  );
});

ipcRenderer.on("vk-input", (_event, payload: KeyboardInputMessage) => {
  withCurrentEditable((target) => {
    const action = payload?.action;
    if (action === "backspace") {
      target.value = String(target.value || "").slice(0, -1);
      dispatchInputEvents(target);
      return;
    }
    if (action === "append") {
      const key = String(payload?.key || "");
      if (!key) return;
      target.value = `${String(target.value || "")}${key}`;
      dispatchInputEvents(target);
      return;
    }
    if (action === "done") {
      target.blur();
      notifyBlur();
    }
  });
});
