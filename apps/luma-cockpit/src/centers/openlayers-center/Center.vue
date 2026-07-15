<script setup lang="ts">
import type {
  AddGeoJSONInput,
  FlowLineLayerHandle,
  GeoJSONRenderHandle,
  LayerHandle,
  MapJSONData,
} from 'my-openlayer'
import type { FeatureLike } from 'ol/Feature'
import type VectorLayer from 'ol/layer/Vector'
import type VectorSource from 'ol/source/Vector'
import type { SceneCenterRendererProps } from '../types'
import { MyOl } from 'my-openlayer'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import 'ol/ol.css'

/***********************my-openlayer 中国飞线中央组件*********************/

const props = defineProps<SceneCenterRendererProps>()
const emit = defineEmits<{
  select: [id: string]
}>()

const REGION_LAYER = 'china-regions'
const REGION_LABEL_LAYER = 'china-region-labels'
const POINT_LAYER = 'operation-nodes'
const ROUTE_GLOW_LAYER = 'route-glow'
const ROUTE_FLOW_LAYER = 'route-flow'

const mapTargetRef = useTemplateRef<HTMLDivElement>('mapTargetRef')
const errorMessage = ref('')

let mapInstance: MyOl | undefined
let regionHandle: GeoJSONRenderHandle | undefined
let regionLabelHandle: GeoJSONRenderHandle | undefined
let pointHandle: GeoJSONRenderHandle | undefined
let routeGlowHandle: LayerHandle | undefined
let routeFlowHandle: FlowLineLayerHandle | null | undefined
let resizeObserver: ResizeObserver | undefined
let initializeFrame = 0

function featureValue(feature: FeatureLike, key: string): unknown {
  const direct = feature.get(key)
  if (direct !== undefined)
    return direct
  const rawData = feature.get('rawData') as Record<string, unknown> | undefined
  return rawData?.[key]
}

function isSelected(id: string): boolean {
  return props.selectedIds.includes(id) || props.focusedId === id
}

function statusOpacity(status?: string): number {
  return !props.filterStatus || props.filterStatus === status ? 1 : 0.16
}

function createRegionStyle(feature: FeatureLike, forceSelected = false): Style {
  const id = String(featureValue(feature, 'regionId') ?? '')
  const status = String(featureValue(feature, 'status') ?? '')
  const active = forceSelected || isSelected(id)
  const opacity = statusOpacity(status)
  const dark = props.theme === 'dark'

  return new Style({
    fill: new Fill({
      color: dark
        ? `rgba(${active ? '11, 89, 120' : '7, 26, 54'}, ${opacity * (active ? 0.92 : 0.78)})`
        : `rgba(${active ? '152, 217, 233' : '216, 237, 246'}, ${opacity * 0.92})`,
    }),
    stroke: new Stroke({
      color: dark
        ? `rgba(67, 216, 255, ${opacity * (active ? 1 : 0.76)})`
        : `rgba(23, 142, 184, ${opacity * (active ? 1 : 0.72)})`,
      width: active ? 2 : 1,
    }),
  })
}

function createRegionLabelStyle(feature: FeatureLike): Style {
  const id = String(featureValue(feature, 'regionId') ?? '')
  const status = String(featureValue(feature, 'status') ?? '')
  const active = isSelected(id)
  const opacity = statusOpacity(status)
  const dark = props.theme === 'dark'
  return new Style({
    text: new Text({
      text: String(featureValue(feature, 'name') ?? ''),
      font: `${active ? 600 : 500} 10px system-ui, sans-serif`,
      fill: new Fill({
        color: dark
          ? `rgba(232, 251, 255, ${opacity * (active ? 1 : 0.76)})`
          : `rgba(16, 57, 75, ${opacity * (active ? 1 : 0.78)})`,
      }),
      stroke: new Stroke({
        color: dark ? 'rgba(2, 12, 28, 0.9)' : 'rgba(247, 252, 255, 0.88)',
        width: 2,
      }),
    }),
  })
}

function createPointStyle(feature: FeatureLike, forceSelected = false): Style {
  const id = String(featureValue(feature, 'id') ?? '')
  const name = String(featureValue(feature, 'name') ?? '')
  const status = String(featureValue(feature, 'status') ?? '')
  const active = forceSelected || isSelected(id)
  const opacity = statusOpacity(status)
  const dark = props.theme === 'dark'

  return new Style({
    image: new CircleStyle({
      radius: active ? 7 : 5,
      fill: new Fill({
        color: active
          ? (dark ? `rgba(0, 229, 160, ${opacity})` : `rgba(0, 150, 109, ${opacity})`)
          : (dark ? `rgba(255, 200, 87, ${opacity})` : `rgba(183, 121, 0, ${opacity})`),
      }),
      stroke: new Stroke({
        color: dark ? `rgba(232, 251, 255, ${opacity})` : `rgba(16, 57, 75, ${opacity})`,
        width: active ? 2 : 1,
      }),
    }),
    text: active
      ? new Text({
          text: name,
          offsetY: -16,
          font: '600 11px system-ui, sans-serif',
          fill: new Fill({ color: dark ? '#e8fbff' : '#10394b' }),
          stroke: new Stroke({ color: dark ? 'rgba(2, 12, 28, 0.92)' : 'rgba(247, 252, 255, 0.92)', width: 3 }),
        })
      : undefined,
  })
}

function selectionStyle(feature: FeatureLike): Style {
  return feature.getGeometry()?.getType() === 'Point'
    ? createPointStyle(feature, true)
    : createRegionStyle(feature, true)
}

function pointGeoJson(): MapJSONData {
  return {
    type: 'FeatureCollection',
    features: demoScene.points.map(point => ({
      type: 'Feature',
      properties: {
        id: point.id,
        name: point.name,
        regionId: point.regionId,
        value: point.value,
        status: point.status,
      },
      geometry: {
        type: 'Point',
        coordinates: point.coordinate,
      },
    })),
  }
}

function regionLabelGeoJson(): MapJSONData {
  return {
    type: 'FeatureCollection',
    features: demoScene.regions.map(region => ({
      type: 'Feature',
      properties: {
        id: `label-${region.id}`,
        regionId: region.id,
        name: region.name,
        status: region.status,
      },
      geometry: {
        type: 'Point',
        coordinates: region.center,
      },
    })),
  }
}

function routeGeoJson(): MapJSONData {
  const routes = props.filterStatus
    ? demoScene.lines.filter(line => line.status === props.filterStatus)
    : demoScene.lines
  return {
    type: 'FeatureCollection',
    features: routes.map(line => ({
      type: 'Feature',
      properties: {
        id: line.id,
        routeId: line.id,
        targetId: line.toId,
        value: line.value,
        status: line.status,
      },
      geometry: {
        type: 'LineString',
        coordinates: line.coordinates,
      },
    })),
  }
}

function refreshVectorStyles(): void {
  for (const handle of regionHandle?.handles ?? [])
    handle.layer.changed()

  for (const handle of regionLabelHandle?.handles ?? []) {
    const layer = handle.layer as VectorLayer<VectorSource>
    for (const feature of layer.getSource()?.getFeatures() ?? [])
      feature.setStyle(createRegionLabelStyle(feature))
    layer.changed()
  }

  for (const handle of pointHandle?.handles ?? []) {
    const layer = handle.layer as VectorLayer<VectorSource>
    for (const feature of layer.getSource()?.getFeatures() ?? [])
      feature.setStyle(createPointStyle(feature))
    layer.changed()
  }
}

function fitChinaView(target: HTMLElement): void {
  if (!mapInstance)
    return
  const layer = regionHandle?.handles[0]?.layer as VectorLayer<VectorSource> | undefined
  const extent = layer?.getSource()?.getExtent()
  if (!extent)
    return
  const horizontalPadding = Math.min(460, Math.max(180, target.clientWidth * 0.235))
  const verticalPadding = Math.min(112, Math.max(72, target.clientHeight * 0.1))
  mapInstance.map.getView().fit(extent, {
    duration: 0,
    padding: [verticalPadding, horizontalPadding, verticalPadding, horizontalPadding],
  })
}

function rebuildRoutes(): void {
  if (!mapInstance)
    return

  routeFlowHandle?.remove()
  routeGlowHandle?.remove()

  const dark = props.theme === 'dark'
  const data = routeGeoJson()
  routeGlowHandle = mapInstance.getLine().addLine(data, {
    layerName: ROUTE_GLOW_LAYER,
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:4326',
    strokeColor: dark ? 'rgba(32, 199, 255, 0.12)' : 'rgba(8, 127, 175, 0.12)',
    strokeWidth: 4,
    zIndex: 3,
  })
  routeFlowHandle = mapInstance.getLine().addFlowLine(data, {
    layerName: ROUTE_FLOW_LAYER,
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:4326',
    animationMode: 'icon+dash',
    autoStart: !props.reducedMotion,
    showBaseLine: true,
    strokeColor: dark ? '#20c7ff' : '#087faf',
    strokeWidth: 1.1,
    lineDash: [8, 10],
    duration: 4800,
    zIndex: 4,
    flowSymbol: {
      color: dark ? '#78e8ff' : '#036f9c',
      scale: 0.54,
      count: 2,
      spacing: 0.2,
      rotateWithView: true,
    },
  })
}

function syncSelection(): void {
  if (!mapInstance)
    return
  const id = props.focusedId || props.selectedIds[0]
  const selector = mapInstance.getSelectHandler().clearSelection()

  // clearSelection 会恢复上一次缓存的样式，必须在重绘当前状态之前执行。
  refreshVectorStyles()
  if (!id)
    return

  const entity = getSceneEntity(id)
  if (!entity)
    return
  selector.selectByProperty(entity.kind === 'region' ? 'regionId' : 'id', id, {
    layerName: entity.kind === 'region' ? REGION_LAYER : POINT_LAYER,
    selectStyle: selectionStyle,
    fitView: false,
  })
}

function destroyMap(): void {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  mapInstance?.destroy()
  mapInstance = undefined
  regionHandle = undefined
  regionLabelHandle = undefined
  pointHandle = undefined
  routeGlowHandle = undefined
  routeFlowHandle = undefined
}

function initializeMap(): void {
  const target = mapTargetRef.value
  if (!target)
    return

  destroyMap()
  errorMessage.value = ''

  try {
    mapInstance = new MyOl(target, {
      center: [104, 35],
      zoom: 4,
      minZoom: 3,
      maxZoom: 9,
      projection: { code: 'EPSG:4326' },
      layers: [],
    })

    regionHandle = mapInstance.addGeoJSON(demoScene.geoJson as unknown as AddGeoJSONInput, {
      layerName: REGION_LAYER,
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326',
      fitView: false,
      polygon: {
        zIndex: 1,
        style: feature => createRegionStyle(feature),
      },
    })
    regionLabelHandle = mapInstance.addGeoJSON(regionLabelGeoJson(), {
      layerName: REGION_LABEL_LAYER,
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326',
      point: {
        zIndex: 5,
        style: feature => createRegionLabelStyle(feature),
      },
    })
    pointHandle = mapInstance.addGeoJSON(pointGeoJson(), {
      layerName: POINT_LAYER,
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326',
      point: {
        zIndex: 6,
        style: feature => createPointStyle(feature),
      },
    })
    rebuildRoutes()

    mapInstance.getSelectHandler().enableSelect('click', {
      layerFilter: [REGION_LAYER, POINT_LAYER],
      hitTolerance: 6,
      selectStyle: selectionStyle,
      onSelect({ selected }) {
        const feature = selected[0]
        if (!feature)
          return
        const id = String(featureValue(feature, 'regionId') ?? featureValue(feature, 'id') ?? '')
        if (id && getSceneEntity(id))
          emit('select', id)
      },
    })

    resizeObserver = new ResizeObserver(() => mapInstance?.map.updateSize())
    resizeObserver.observe(target)
    mapInstance.map.updateSize()
    fitChinaView(target)
    syncSelection()
  }
  catch (error) {
    destroyMap()
    errorMessage.value = error instanceof Error ? error.message : '地图初始化失败'
  }
}

watch(
  () => [props.selectedIds.join(','), props.focusedId],
  syncSelection,
)

watch(
  () => [props.theme, props.filterStatus, props.reducedMotion],
  () => {
    rebuildRoutes()
    syncSelection()
  },
)

onMounted(() => {
  initializeFrame = requestAnimationFrame(() => {
    void nextTick(initializeMap)
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(initializeFrame)
  destroyMap()
})
</script>

<template>
  <div class="openlayers-center" data-center-renderer="openlayers">
    <div
      ref="mapTargetRef"
      class="openlayers-center__map"
      role="img"
      aria-label="全国运行态势 OpenLayers 飞线图"
    />
    <div v-if="errorMessage" class="openlayers-center__error" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" @click="initializeMap">
        重新加载
      </button>
    </div>
  </div>
</template>

<style scoped>
.openlayers-center,
.openlayers-center__map {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.openlayers-center {
  position: relative;
  overflow: hidden;
}

.openlayers-center__map {
  background: transparent;
}

.openlayers-center__map :deep(.ol-viewport) {
  background: transparent;
}

.openlayers-center__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--luma-cockpit-map-mask);
  color: var(--luma-cockpit-text-secondary);
}

.openlayers-center__error button {
  min-width: 88px;
  min-height: 44px;
  border: 1px solid var(--luma-cockpit-accent);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: var(--luma-cockpit-title-text);
  cursor: pointer;
}

.openlayers-center__error button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
