export function scrollToId(id, block = 'start') {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block });
}
