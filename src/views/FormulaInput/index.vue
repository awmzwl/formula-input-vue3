<template>
  <div class="formula-input-wrapper">
    <div ref="formulaRef" class="input" :class="{ error: errorMsg }"
      :contenteditable="disabled ? 'false' : 'plaintext-only'" :placeholder="placeholder" style="ime-mode: disabled;"
      @keydown.stop="onKeydown" @keyup="onKeyup" @blur="setValue"></div>
    <div class="hint" v-if="errorMsg">{{ errorMsg }}</div>
    <div class="formula-input-selection" v-if="showSelection" ref="selectionRef" @click.stop>
      <el-input v-model="filter" ref="inputRef" placeholder="输入关键字筛选"></el-input>
      <div class="options" v-if="displayOptions.length">
        <span class="option" v-for="(item, i) in displayOptions" :key="i" @click="optionClick(item)">
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

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      formula: '',
      vars: {}
    })
  },
  placeholder: String,
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
  }
});

const emit = defineEmits(['update:value', 'change']);

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
}

function resetDisplay(from, to = '') {
  let text = formulaRef.value.innerHTML;

  if (text.includes(from)) {
    // 替换 `from` 为 `to`
    const newText = text.replace(new RegExp(from, 'g'), to);
    formulaRef.value.innerHTML = newText;

    // 使用 nextTick 确保 DOM 更新后再设置光标
    nextTick(() => {
      const target = formulaRef.value;
      let cursorIndex = 0;
      let originalCount=0;
      if (to === '') {
        cursorIndex = text.indexOf(from);
      } else {
        const before = text.substring(0, text.indexOf(from) + from.length);
        originalCount = (before.match(new RegExp(to, 'g')) || []).length;
        cursorIndex = newText.indexOf(to, originalCount * to.length) + to.length;
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