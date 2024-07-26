export const getHTMLList = ({ text, prefix, suffix }) =>
  text
    .replace(new RegExp(prefix, 'g'), ',')
    .replace(new RegExp(suffix, 'g'), ',')
    .split(',')
    .filter(v => !!v)

export const str2dom = v => {
  const objE = document.createElement('div')
  objE.innerHTML = v
  return [...objE.childNodes]
}

export const dom2str = node => {
  let tmpNode = document.createElement('div')
  tmpNode.appendChild(node)
  let str = tmpNode.innerHTML
  tmpNode = node = null
  return str
}

export const isHTML = v =>
  Object.prototype.toString.call(v) === '[object HTMLDivElement]'

export const defaultKeys = '0123456789+-*/%!@.()'

export const getDiffIndex = (s1, s2) => {
  const l1 = s1.split('')
  const l2 = s2.split('')
  const max = Math.max(l1.length, l2.length)
  let index = 0
  for (let i = 0; i < max; i++) {
    if (l1[i] == l2[i]) {
      index++
    } else {
      break
    }
  }
  return index
}

export const setFocus = (el, index) => {
  const range = document.createRange()
  const sel = window.getSelection()
  let nodeIndex = 0
  let offsetIndex = 0
  const list = str2dom(el.innerHTML)
  console.log(list);
  for (let i = 0; i < list.length&&index; i++) {
    const v = list[i]
    if (isHTML(v)) {
      index -= dom2str(v).length
      console.log(dom2str(v));
      console.log(index);
    } else {
      if (index > v.length) {
        index -= v.length
      } 
      else {
        offsetIndex = index
        break
      }
    }
    nodeIndex++
  }
  range.selectNodeContents(el)
  range.collapse(false)
  if(el.childNodes[nodeIndex]){
    console.log(el.childNodes[nodeIndex].nodeType)
    const targetNode = el.childNodes[nodeIndex];
    const previousNode = el.childNodes[nodeIndex - 1];
    if(targetNode&&previousNode){
      range.setStartAfter(previousNode);
      range.setEndBefore(targetNode);
    }
  }
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

export const getParentNode = (el, className) => {
  if (!el) return null
  do {
    el = el.parentNode
  } while (el && !el.className.includes(className))
  return el
}
