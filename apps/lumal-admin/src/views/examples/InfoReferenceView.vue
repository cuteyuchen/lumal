<script setup lang="ts">
import { LumalInfoTable, LumalPage } from '@lumal/core/components'
import { LumalIconPicker } from '@lumal/icons-vue'
import { ElButton, ElInput, ElSwitch } from 'element-plus'
import { computed, shallowRef } from 'vue'
import AppIconGroupSelect from '../../components/app/AppIconGroupSelect.vue'
import { frameworkInfoItems } from './example-data'

/***********************信息与图标状态*********************/
const compact = shallowRef(false)
const showEmpty = shallowRef(false)
const selectedIcon = shallowRef('')
const search = shallowRef('')
const infoItems = computed(() => showEmpty.value ? [] : frameworkInfoItems.filter(item => !search.value || String(item.label).includes(search.value) || String(item.value).includes(search.value)))
const apiItems = computed(() => [{ label: '字段语义', value: 'label / value / hidden / span' }, { label: '当前列数', value: compact.value ? 1 : 2 }, { label: '筛选结果', value: infoItems.value.length }, { label: '已选图标', value: selectedIcon.value || '尚未选择' }])
</script>

<template>
  <main class="lumal-admin-example">
    <LumalPage title="InfoTable 与 Icon" description="信息展示与图标选择的完整交互示例，不引入独立 OverflowTooltip。">
      <div class="info-toolbar">
        <ElInput v-model="search" clearable placeholder="筛选信息项" class="info-search" /><span>单列布局</span><ElSwitch v-model="compact" /><ElButton @click="showEmpty = !showEmpty">
          {{ showEmpty ? '恢复数据' : '模拟空状态' }}
        </ElButton>
      </div>
      <LumalInfoTable :items="infoItems" :columns="compact ? 1 : 2" label-width="96px" empty-text="没有匹配的信息项" />
    </LumalPage><LumalPage title="图标选择器" description="搜索并选择已注册图标，选择结果会同步到状态面板。">
      <LumalIconPicker v-model="selectedIcon">
        <template #group-select="slotProps">
          <AppIconGroupSelect v-bind="slotProps" />
        </template>
      </LumalIconPicker>
      <LumalInfoTable class="info-state" :items="apiItems" :columns="2" label-width="96px" />
    </LumalPage>
  </main>
</template>

<style scoped lang="scss">
.info-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}.info-search{max-width:280px}.info-state{margin-top:20px}
</style>
