<template>
  <formula-input style="width: 600px;" v-model="model" :options="options" isCheck v-model:check="formulaCheck"></formula-input>
</template>

<script setup>
import FormulaInput from './views/FormulaInput/index.vue'
import { ref, watch } from 'vue'
const validKeys='0123456789+-*/%@()'
const formulaCheck = ref(false)
const model = ref({
  formula: '{bonus}+{bs}+300',
  vars: {
    "{bonus}": '奖金',
    "{bs}": '基本工资'
  }
})
const options = ref([
  {
    field: '{bs}',
    name: '基本工资'
  },
  {
    field: '{workHour}',
    name: '每日工作时长'
  },
  {
    field: '{bonus}',
    name: '奖金'
  },
  {
    field: '{fullAttendance}',
    name: '满勤'
  },
  {
    field: '{erformance}',
    name: '绩效'
  }
])

function afterChange(v) {
  // console.log(model.value)
}
</script>
<style>

</style>
