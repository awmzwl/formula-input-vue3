<template>
  <formula-input :validKeys="validKeys" style="width: 600px;" placeholder="输入「@」后选择" :options="options" v-model="model" @change="afterChange"></formula-input>
</template>

<script setup>
import FormulaInput from './views/FormulaInput/index.vue'
import { ref, watch } from 'vue'
const validKeys='0123456789+-*/%!@.()'
const model = ref({
  formula: 'salary+bonus+performance+300',
  vars: {
    salary: '基本工资',
    bonus: '奖金',
    performance: '绩效'
  }
})
const options = ref([
  {
    field: 'Br',
    name: 'Br'
  },
  {
    field: 'salary',
    name: '基本工资'
  },
  {
    field: 'workHour',
    name: '每日工作时长'
  },
  {
    field: 'bonus',
    name: '奖金'
  },
  {
    field: 'fullAttendance',
    name: '满勤'
  },
  {
    field: 'performance',
    name: '绩效'
  }
])

function afterChange(v) {
  // console.log(model.value)
}
</script>
<style>
.read-the-docs {
  color: #888;
}
</style>
