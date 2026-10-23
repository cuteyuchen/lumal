<script setup lang="ts">
import { useElementSize } from '@lumal/viewport'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import VectorSource from 'ol/source/Vector'
import { Circle, Fill, Stroke, Style } from 'ol/style'
import View from 'ol/View'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

/***********************独立地图实例与脱敏矢量数据*********************/
const mapElement = useTemplateRef<HTMLElement>('mapElement')
const { size } = useElementSize({ target: mapElement })
const clicks = shallowRef(0)
const clickError = shallowRef(0)
const resizes = shallowRef(0)
const instance = shallowRef(0)
let map: Map | undefined
onMounted(() => {
  map = new Map({
    target: mapElement.value!,
    controls: [],
    layers: [new VectorLayer({
      source: new VectorSource({ features: [new Feature(new Point([0, 0]))] }),
      style: new Style({ image: new Circle({ radius: 12, fill: new Fill({ color: '#cf3f66' }), stroke: new Stroke({ color: '#fff', width: 3 }) }) }),
    })],
    view: new View({ center: [0, 0], zoom: 3 }),
  })
  instance.value++
  map.on('singleclick', (event) => {
    clicks.value++
    const pixel = map!.getPixelFromCoordinate(event.coordinate)
    clickError.value = Math.hypot(pixel[0]! - event.pixel[0]!, pixel[1]! - event.pixel[1]!)
  })
  map.updateSize()
})

/***********************只更新容器尺寸，不重建地图或拉取数据*********************/
watch(size, () => {
  map?.updateSize()
  resizes.value++
}, { flush: 'post' })
onBeforeUnmount(() => {
  map?.setTarget(undefined)
  map?.dispose()
})
</script>

<template>
  <div
    ref="mapElement" class="map-surface" data-testid="map" :data-instance="instance"
    :data-clicks="clicks" :data-click-error="clickError" :data-resizes="resizes"
    :data-size="`${size.width},${size.height}`"
  />
</template>

<style scoped>
.map-surface { position: absolute; inset: 0; background: #d9e9e3; }
</style>
