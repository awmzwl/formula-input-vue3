export const getHTMLList = ({ text, prefix, suffix }) =>
  text
    .replaceAll(prefix, ',')
    .replaceAll(suffix, ',')
    .split(',')
    .filter(Boolean)

export const str2dom = (v) => {
  const container = document.createElement('div')
  container.innerHTML = v
  return Array.from(container.childNodes)
}

export const dom2str = (node) => {
  const container = document.createElement('div')
  container.appendChild(node.cloneNode(true))
  return container.innerHTML
}

export const isHTML = (v) => v instanceof HTMLElement

export const defaultKeys = '0123456789+-*/%@()'

export const getDiffIndex = (s1, s2) => {
  const length = Math.max(s1.length, s2.length)
  for (let i = 0; i < length; i++) {
    if (s1[i] !== s2[i]) return i
  }
  return length
}

export const setFocus = (el, index) => {
  const range = document.createRange()
  const sel = window.getSelection()

  const nodes = str2dom(el.innerHTML)
  let nodeIndex = 0
  let offsetIndex = 0

  for (const node of nodes) {
    if (isHTML(node)) {
      index -= dom2str(node).length
    } else if (index > node.textContent.length) {
      index -= node.textContent.length
    } else {
      offsetIndex = index
      break
    }
    nodeIndex++
  }

  if (index <= 0) {
    while (index < 0) {
      nodeIndex--
      index += dom2str(nodes[nodeIndex]).length
    }
    el.childNodes[nodeIndex]&&range.setEndBefore(el.childNodes[nodeIndex])
    el.childNodes[nodeIndex - 1]&&range.setStartAfter(el.childNodes[nodeIndex - 1])
  } else {
    range.setStart(el.childNodes[nodeIndex], offsetIndex)
  }

  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

export const getParentNode = (el, className) => {
  while (el && el !== document) {
    el = el.parentNode
    if (el && el.classList.contains(className)) return el
  }
  return null
}
