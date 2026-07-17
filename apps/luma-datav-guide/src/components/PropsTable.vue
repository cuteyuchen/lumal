<script setup lang="ts">
export interface PropRow {
  name: string
  type: string
  default?: string
  description: string
}

defineProps<{
  title?: string
  rows: PropRow[]
  /** 表头首列名称，默认「属性」。config 表可传「字段」。 */
  nameLabel?: string
}>()
</script>

<template>
  <div class="props-table">
    <h3 v-if="title" class="props-table__title">
      {{ title }}
    </h3>
    <div class="props-table__scroll">
      <table>
        <thead>
          <tr>
            <th>{{ nameLabel ?? '属性' }}</th>
            <th>类型</th>
            <th>默认值</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <td><code>{{ row.name }}</code></td>
            <td><code class="props-table__type">{{ row.type }}</code></td>
            <td>{{ row.default ?? '—' }}</td>
            <td>{{ row.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
