<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  code: string
  language?: string
}>()

const copied = ref(false)

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1500)
  }
  catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="code-block">
    <button type="button" class="code-block__copy" @click="copy">
      {{ copied ? '已复制' : '复制' }}
    </button>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
