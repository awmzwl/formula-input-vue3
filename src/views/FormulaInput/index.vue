<template>
  <div class="formula-input-wrapper">
    <div ref="formulaRef" class="input" :class="{ error: errorMsg }"
      :contenteditable="disabled ? 'false' : 'plaintext-only'" :placeholder="placeholder" style="ime-mode: disabled;"
      @keydown.stop="onKeydown" @keyup="onKeyup" @blur="setValue"></div>
    <div class="hint" v-if="errorMsg">&nbsp;{{ errorMsg }}</div>
    <div class="formula-input-selection" v-if="showSelection&&!disabled" ref="selectionRef" @click.stop>
      <el-input v-model="filter" ref="inputRef" placeholder="输入关键字筛选" @keydown="escKeyDown" @keyup="escKeyup"></el-input>
      <div class="options" v-if="displayOptions.length">
        <span class="option"  :class="{ 'selected': i === selectedOptionIndex }"  v-for="(item, i) in displayOptions" :key="i" :ref="setOptionRef(i)" @click="optionClick(item)">
          {{ item.name }}
        </span>
      </div>
      <div class="empty" v-else>暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount,nextTick } from 'vue';
import { ElInput } from 'element-plus';
import 'element-plus/dist/index.css';
import throttle from 'lodash/throttle';
import {
  getHTMLList,
  str2dom,
  dom2str,
  isHTML,
  defaultKeys,
  setFocus,
  getDiffIndex,
  getParentNode
} from './utils';
const optionRefs = ref([]);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      formula: '',
      vars: {}
    })
  },
  placeholder: {
    type: String,
    default: '输入「@」后选择'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  scrollWrapperClassName: String,
  options: {
    type: Array,
    default: () => []
  },
  validKeys: {
    type: String,
    default: defaultKeys
  },
  isCheck:{
    type:Boolean,
    default:false
  },
  check:{
    type:Boolean,
    default:false
  }
});

const emit = defineEmits(['update:value', 'change', 'update:check']);

const formulaRef = ref(null);
const selectionRef = ref(null);
const inputRef = ref(null);
const filter = ref('');
const showSelection = ref(false);
const errorMsg = ref('');
const innerModel = reactive(props.modelValue || { formula: '', vars: {} });
const displayOptions = computed(() => {
  return props.options.filter(({ name }) => name.includes(filter.value));
});

const throttleSetSelectionStyle = throttle(setSelectionStyle, 100);

watch(() => props.modelValue, (newVal) => {
  Object.assign(innerModel, newVal || { formula: '', vars: {} });
  initDisplay();
  errorMsg.value = '';
});

watch(() => showSelection.value, (newVal) => {
  if (!newVal) {
    removeEventListener();
  }
});

onMounted(() => {
  initDisplay();
});

onBeforeUnmount(() => {
  removeEventListener();
  const ele = document.querySelector('.formula-input-selection');
  ele && ele.parentNode.removeChild(ele);
});
function setOptionRef(index) {
  return (el) => {
    optionRefs.value[index] = el;
  };
}
function addEventListener() {
  window.addEventListener('click', removeSelection);
  if (props.scrollWrapperClassName) {
    const el = getParentNode(formulaRef.value, props.scrollWrapperClassName);
    el && el.addEventListener('scroll', throttleSetSelectionStyle);
  }
}

function removeEventListener() {
  window.removeEventListener('click', removeSelection);
  if (props.scrollWrapperClassName) {
    const el = getParentNode(formulaRef.value, props.scrollWrapperClassName);
    el && el.removeEventListener('scroll', throttleSetSelectionStyle);
  }
}

function onKeyup() {
  const target = formulaRef.value;
  const originStr = target.innerHTML;
  let list = str2dom(originStr);
  list = list.map(v =>
    isHTML(v)
      ? dom2str(v)
      : v.data
        .split('')
        .filter(v => props.validKeys.includes(v))
        .join('')
  );
  const filteredStr = list.join('');
  if (originStr !== filteredStr) {
    const index = getDiffIndex(originStr, filteredStr);
    target.innerHTML = filteredStr;
    setFocus(target, index);
  }
}

function initDisplay() {
  const { vars, formula: formulaValue } = innerModel;
  let result = formulaValue;
  for (let key in vars) {
    const rule = new RegExp(key, 'g');
    const name = `<div contenteditable="false">${vars[key]}<span>${key}</span></div>`;
    result = result.replace(rule, (v, index, string) => {
      const length = v.length;
      const str = string.slice(index - 1, length + index + 1);
      if (str.startsWith('_') || str.endsWith('_')) {
        return key;
      } else {
        return name;
      }
    });
  }
  formulaRef.value.innerHTML = result;
}
const selectedOptionIndex = ref(0);  // 记录高亮选项的索引
function confirmSelectedOption() {
  if (displayOptions.value.length > 0) {
    optionClick(displayOptions.value[selectedOptionIndex.value]);
  }
}
function escKeyup(e) {
  switch (e.key) {
    case 'ArrowDown':
      getClosestOption('down');
      break;
    case 'ArrowUp':
      getClosestOption('up');
      break;
    case 'ArrowRight':
      selectedOptionIndex.value<displayOptions.value.length-1?selectedOptionIndex.value++:selectedOptionIndex.value=0;
      break;
    case 'ArrowLeft':
      selectedOptionIndex.value?selectedOptionIndex.value--:selectedOptionIndex.value=displayOptions.value.length-1;
      break;
    case 'Enter':
      confirmSelectedOption();
      break;
    default:
      filter.value = e.target.value;
      break;
  }
}
function escKeyDown(e) {
  if(e.key=='Escape'){
    removeSelection(e);
    selectedOptionIndex.value = 0;
    e.stopPropagation();
  }
}

function getClosestOption(direction = 'down') {
  const currentIndex = selectedOptionIndex.value;
  const options = optionRefs.value;

  // 确保存在当前选项
  const currentElement = options[currentIndex];
  if (!currentElement) {
    return null;
  }

  const currentRect = currentElement.getBoundingClientRect();
  const currentCenterX = currentRect.left + (currentRect.width / 2);
  const currentCenterY = currentRect.top + (currentRect.height / 2);

  let closestIndex = null;
  let closestDistance = Infinity;

  options.forEach((element, index) => {
    if (index === currentIndex) return; // 跳过当前选项

    const elementRect = element.getBoundingClientRect();
    const elementCenterX = elementRect.left + (elementRect.width / 2);
    const elementCenterY = elementRect.top + (elementRect.height / 2);

    // 计算 X 和 Y 轴的距离
    const xDistance = Math.abs(elementCenterX - currentCenterX);
    const yDistance = Math.abs(elementCenterY - currentCenterY);

    // 优先考虑 X 轴距离，可以设置一个权重
    const distance = xDistance * 2 + yDistance;

    // 根据方向判断最近的选项
    if (direction === 'down' && elementCenterY > currentCenterY) {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    } else if (direction === 'up' && elementCenterY < currentCenterY) {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }
  });

  closestIndex!=null&& (selectedOptionIndex.value = closestIndex);
  return closestIndex;
}
function removeSelection(e) {
  showSelection.value = false;
  e && resetDisplay('@');
}
function onKeydown(e) {
  const { key } = e;
  switch (key) {
    case 'Enter':
      e.preventDefault();
      break;
    case '@':
      // case 'Process':
      openSelection();
      break;
    default:
      break;
  }
}

function openSelection() {
  filter.value = '';
  showSelection.value = true;
  setTimeout(() => {
    document.body.appendChild(selectionRef.value);
    setSelectionStyle();
    addEventListener();
    inputRef.value.focus();
  }, 0);
}

function setSelectionStyle() {
  const { top, left, height, width } = formulaRef.value.getBoundingClientRect();
  selectionRef.value.setAttribute(
    'style',
    `left: ${left}px; top: ${top + height}px; width: ${width > 300 ? width : 300}px`
  );
}

function optionClick(item) {
  const { name, field } = item;
  showSelection.value = false;
  const res = `<div contenteditable="false">${name}<span>${field}</span></div>`;
  resetDisplay('@', res);
  selectedOptionIndex.value = 0; // 选择后重置高亮索引
}

function resetDisplay(from, to = '') {
  let text = formulaRef.value.innerHTML;

  if (text.includes(from)) {
    let fromIndex = text.indexOf(from);
    const newText = text.replace(new RegExp(from, 'g'), to);
    formulaRef.value.innerHTML = newText;
    nextTick(() => {
      const target = formulaRef.value;
      let cursorIndex = 0;
      if (to === '') {
        cursorIndex = fromIndex;
      } else {
        cursorIndex = fromIndex + to.length;
      }
      setFocus(target, cursorIndex);
    });
  }
  setValue();
}

function setValue() {
  errorMsg.value = '';
  let formulaValue = '';
  const vars = {};
  const text = formulaRef.value.innerHTML.replace(
    /\sdata-spm-anchor-id=".*?"/g,
    ''
  );
  const list = getHTMLList({
    text,
    prefix: '<div contenteditable="false">',
    suffix: '</div>'
  });
  list.forEach(item => {
    const [v1, v2] = getHTMLList({
      text: item,
      prefix: '<span>',
      suffix: '</span>'
    });
    if (v2) {
      formulaValue += v2;
      vars[v2] = v1;
    } else {
      formulaValue += v1;
    }
  });
  const res = {
    formula: formulaValue,
    vars
  };
  emit('update:modelValue', res);
  emit('change', res);
  nextTick(() => {
    props.isCheck&&(emit('update:check', checkFormula()));
  });
}

/** 检查公式格式 */
const checkFormula = () => {
  let formula=props.modelValue.formula;
  let reg = /}{|^[+\-*/%]|[+\-*/%]$|\d{|}\d|}\(|\(}|\(\)|\d\(|\)\d|\)\(|\([+\-*/%]|[+\-*/%]\)|[+\-*/%]{2,}/;
  let arr=formula.match(reg)||!is_leagl_brackets(formula)||!formula;
  if(arr){
    errorMsg.value=("公式格式错误或为空");
    return false;
  }
  return true;
}
/** 检查括号是否成对匹配 */
const is_leagl_brackets=(str)=> {
  var array = [];
  for (var i = 0; i < str.length; i++) {
    var item = str[i];
    if (item === "(") {
      array.push("(");
    } else if (item === ")") {
      if (array.length === 0) {
        return false;
      } else {
        array.pop();
      }
    } else {
      continue;
    }
  };
  return array.length === 0;
}
function validate() {
  errorMsg.value = '';
  const { formula: formulaValue } = props.modelValue || {};
  if (!formulaValue) {
    errorMsg.value = '公式不能为空';
    return false;
  }
  return true;
}
</script>

<style lang="less">
@import './index.less';
</style>