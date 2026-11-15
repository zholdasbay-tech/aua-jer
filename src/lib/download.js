export function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function copyText(text) {
  try {
    return navigator.clipboard.writeText(text).then(() => true, () => false);
  } catch {
    return Promise.resolve(false);
  }
}
