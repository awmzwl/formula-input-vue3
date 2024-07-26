<template>
  <formula-input :validKeys="validKeys" style="width: 600px;" placeholder="输入「@」后选择指标" :options="options" v-model="model" @change="afterChange"></formula-input>
</template>

<script setup>
import FormulaInput from './views/FormulaInput/index.vue'
import { ref, watch } from 'vue'
const validKeys='0123456789+-*/%!@.()'
const model = ref({
  formula: '1+superman+2-batman+3',
  vars: {
    superman: 'ClarkKent',
    batman: 'BruceWayne',
  }
})
const options = ref([
  {
    field: 'superman',
    name: 'ClarkKent'
  },
  {
    field: 'batman',
    name: 'BruceWayne'
  },
  {
    field: 'theflash',
    name: 'BarryAllen'
  },
  {
    field: 'wonderwoman',
    name: 'DianaPrince'
  },
  {
    field: 'aquaman',
    name: 'ArthurCurry'
  },
  {
    field: 'cyborg',
    name: 'VictorStone'
  },
  {
    field: 'greenlantern',
    name: 'HalJordan'
  }
])
const cs=() => {
  console.log(model.value)
}
function afterChange(v) {
}
</script>
<style>
.read-the-docs {
  color: #888;
}
</style>