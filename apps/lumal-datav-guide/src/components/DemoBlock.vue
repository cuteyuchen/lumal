<script setup lang="ts">
import { ref, useId } from 'vue'
import CodeBlock from './CodeBlock.vue'

defineProps<{
  title: string
  description?: string
  code: string
  /** 预览区背景，深色驾驶舱底或透明。 */
  surface?: 'dark' | 'plain'
  /** 预览区最小高度，默认 200px。 */
  minHeight?: number
}>()

const showCode = ref(false)
const codeId = `demo-code-${useId()}`
</script>

<template>
  <section class="demo-block">
    <header class="demo-block__head">
      <div>
        <h3 class="demo-block__title">
          {{ title }}
        </h3>
        <p v-if="description" class="demo-block__desc">
          {{ description }}
        </p>
      </div>
      <button
        type="button"
        class="demo-block__toggle"
        :aria-controls="codeId"
        :aria-expanded="showCode"
        @click="showCode = !showCode"
      >
        {{ showCode ? '收起代码' : '查看代码' }}
      </button>
    </header>

    <div
      class="demo-block__stage"
      :class="`demo-block__stage--${surface ?? 'dark'}`"
      :style="{ minHeight: `${minHeight ?? 200}px` }"
    >
      <slot />
    </div>

    <CodeBlock v-if="showCode" :id="codeId" :code="code" language="vue" />
  </section>
</template>
