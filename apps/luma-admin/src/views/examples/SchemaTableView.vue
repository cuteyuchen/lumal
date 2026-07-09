<script setup lang="ts">
import { LumaPage, LumaSchemaTable } from '@luma/core/components'
import { exampleTableColumns, exampleTableRows } from './example-data'
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Schema Table" description="验证列配置、空值占位、row-key 和字典回显。">
      <LumaSchemaTable :columns="exampleTableColumns" :rows="exampleTableRows" row-key="id" />
    </LumaPage>
  </main>
</template>
