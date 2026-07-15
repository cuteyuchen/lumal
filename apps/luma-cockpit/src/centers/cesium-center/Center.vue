<script setup lang="ts">
import type { Entity } from 'cesium'
import type { SceneLine, SceneStatus } from '../../data/demo-scene'
import type { SceneCenterRendererProps } from '../types'
import {
  ArcType,
  CallbackPositionProperty,
  Cartesian2,
  Cartesian3,
  Math as CesiumMath,
  ClockRange,
  Color,
  DistanceDisplayCondition,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  HorizontalOrigin,
  JulianDate,
  LabelStyle,
  PolygonGraphics,
  PolylineGlowMaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  Viewer,
} from 'cesium'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import 'cesium/Build/Cesium/Widgets/widgets.css'

/***********************Cesium 三维中国飞线中央组件*********************/

const props = defineProps<SceneCenterRendererProps>()
const emit = defineEmits<{
  select: [id: string]
}>()

const ROUTE_BASE_HEIGHT = 155_000
const POINT_HEIGHT = 185_000
const CAMERA_HEIGHT = 6_400_000

const mapTargetRef = useTemplateRef<HTMLDivElement>('mapTargetRef')
const loading = ref(true)
const errorMessage = ref('')

const regionGeoJson = {
  type: 'FeatureCollection',
  features: demoScene.geoJson.features.filter(feature => Boolean(feature.properties.regionId)),
}

const regionEntities = new Map<string, Entity[]>()
const sceneIdByEntity = new Map<Entity, string>()

let viewer: Viewer | undefined
let regionDataSource: GeoJsonDataSource | undefined
let clickHandler: ScreenSpaceEventHandler | undefined
let resizeObserver: ResizeObserver | undefined
let initializeFrame = 0
let generation = 0
let animationStart = JulianDate.now()

function color(value: string, alpha = 1): Color {
  return Color.fromCssColorString(value).withAlpha(alpha)
}

function statusOpacity(status: SceneStatus): number {
  return !props.filterStatus || props.filterStatus === status ? 1 : 0.16
}

function selectedId(): string {
  return props.focusedId || props.selectedIds[0] || ''
}

function selectedRegionId(): string {
  const entity = getSceneEntity(selectedId())
  return entity?.kind === 'point' ? entity.regionId : entity?.id ?? ''
}

function regionHeight(value: number, selected: boolean): number {
  return 24_000 + Math.max(0, value - 64) * 1_800 + (selected ? 62_000 : 0)
}

function routePositions(line: SceneLine): Cartesian3[] {
  const peakHeight = 280_000 + line.value * 1_800
  return line.coordinates.map(([longitude, latitude], index) => {
    const progress = index / Math.max(line.coordinates.length - 1, 1)
    const height = ROUTE_BASE_HEIGHT + Math.sin(Math.PI * progress) * peakHeight
    return Cartesian3.fromDegrees(longitude, latitude, height)
  })
}

function movingPosition(
  positions: Cartesian3[],
  time: JulianDate,
  routeIndex: number,
  result?: Cartesian3,
): Cartesian3 {
  const duration = 4.8 + (routeIndex % 5) * 0.55
  const elapsed = JulianDate.secondsDifference(time, animationStart)
  const phase = routeIndex / demoScene.lines.length
  const progress = ((elapsed / duration + phase) % 1 + 1) % 1
  const segment = progress * (positions.length - 1)
  const index = Math.min(Math.floor(segment), positions.length - 2)
  return Cartesian3.lerp(positions[index], positions[index + 1], segment - index, result ?? new Cartesian3())
}

function applyViewerTheme(): void {
  if (!viewer)
    return
  const dark = props.theme === 'dark'
  viewer.scene.backgroundColor = color(dark ? '#020817' : '#aeb8c2')
  viewer.scene.globe.baseColor = color(dark ? '#031329' : '#dceef4')
  viewer.scene.requestRender()
}

function applyMotionPreference(): void {
  if (!viewer)
    return
  viewer.clock.shouldAnimate = !props.reducedMotion
  viewer.scene.requestRenderMode = props.reducedMotion
  viewer.scene.maximumRenderTimeChange = props.reducedMotion ? Number.POSITIVE_INFINITY : 0
  viewer.scene.requestRender()
}

function applyRegionStyles(): void {
  const dark = props.theme === 'dark'
  const activeRegionId = selectedRegionId()

  for (const region of demoScene.regions) {
    const selected = activeRegionId === region.id
    const opacity = statusOpacity(region.status)
    const fill = selected
      ? (dark ? '#0a9ec2' : '#1793b3')
      : (dark ? '#075071' : '#8bc8d8')
    const outline = selected
      ? (dark ? '#8cf2ff' : '#056f91')
      : (dark ? '#2bc8f3' : '#1681a2')

    for (const entity of regionEntities.get(region.id) ?? []) {
      const hierarchy = entity.polygon?.hierarchy
      if (!hierarchy)
        continue
      entity.polygon = new PolygonGraphics({
        hierarchy,
        height: 4_000,
        extrudedHeight: regionHeight(region.value, selected),
        material: color(fill, opacity * (selected ? 0.92 : 0.64)),
        outline: true,
        outlineColor: color(outline, opacity * (selected ? 1 : 0.78)),
        perPositionHeight: false,
        closeTop: true,
        closeBottom: true,
      })
    }
  }
}

function registerRegionEntities(): void {
  sceneIdByEntity.clear()
  for (const [id, entities] of regionEntities) {
    for (const entity of entities)
      sceneIdByEntity.set(entity, id)
  }
}

function rebuildOverlays(): void {
  if (!viewer)
    return

  const dark = props.theme === 'dark'
  const activeId = selectedId()
  const activeRegionId = selectedRegionId()
  const collection = viewer.entities

  collection.suspendEvents()
  try {
    collection.removeAll()
    registerRegionEntities()

    for (const region of demoScene.regions) {
      const selected = activeRegionId === region.id
      const opacity = statusOpacity(region.status)
      const label = collection.add({
        id: `cesium-label-${region.id}`,
        position: Cartesian3.fromDegrees(
          region.center[0],
          region.center[1],
          regionHeight(region.value, selected) + 28_000,
        ),
        label: {
          text: region.name,
          font: `${selected ? 600 : 500} ${selected ? 12 : 10}px system-ui, sans-serif`,
          style: LabelStyle.FILL_AND_OUTLINE,
          fillColor: color(dark ? '#e8fbff' : '#10394b', opacity),
          outlineColor: color(dark ? '#020c1c' : '#f7fcff', opacity * 0.94),
          outlineWidth: selected ? 4 : 3,
          showBackground: selected,
          backgroundColor: color(dark ? '#031a30' : '#eef8fb', 0.82),
          backgroundPadding: new Cartesian2(6, 4),
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new DistanceDisplayCondition(0, 8_500_000),
        },
        properties: { sceneId: region.id },
      })
      sceneIdByEntity.set(label, region.id)
    }

    for (const point of demoScene.points) {
      const selected = activeId === point.id
      const opacity = statusOpacity(point.status)
      const pointEntity = collection.add({
        id: `cesium-point-${point.id}`,
        position: Cartesian3.fromDegrees(point.coordinate[0], point.coordinate[1], POINT_HEIGHT),
        point: {
          pixelSize: selected ? 14 : 9,
          color: color(selected ? (dark ? '#00e5a0' : '#008e68') : (dark ? '#ffc857' : '#a96f00'), opacity),
          outlineColor: color(dark ? '#e8fbff' : '#10394b', opacity),
          outlineWidth: selected ? 3 : 1.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          show: selected,
          text: point.name,
          font: '600 12px system-ui, sans-serif',
          style: LabelStyle.FILL_AND_OUTLINE,
          fillColor: color(dark ? '#e8fbff' : '#10394b'),
          outlineColor: color(dark ? '#020c1c' : '#f7fcff', 0.94),
          outlineWidth: 4,
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: { sceneId: point.id },
      })
      sceneIdByEntity.set(pointEntity, point.id)
    }

    for (const [index, line] of demoScene.lines.entries()) {
      const selected = activeRegionId === line.toId
      const opacity = statusOpacity(line.status)
      const positions = routePositions(line)
      const routeColor = color(
        selected ? (dark ? '#8cf2ff' : '#036f9c') : (dark ? '#20c7ff' : '#087faf'),
        opacity * (selected ? 0.96 : 0.48),
      )

      collection.add({
        id: `cesium-route-${line.id}`,
        polyline: {
          positions,
          width: selected ? 4.5 : 2,
          material: new PolylineGlowMaterialProperty({
            color: routeColor,
            glowPower: selected ? 0.32 : 0.18,
            taperPower: 0.72,
          }),
          arcType: ArcType.NONE,
          clampToGround: false,
        },
      })

      collection.add({
        id: `cesium-route-mover-${line.id}`,
        position: new CallbackPositionProperty(
          (time, result) => movingPosition(positions, time ?? animationStart, index, result),
          false,
        ),
        point: {
          show: !props.reducedMotion && opacity > 0.2,
          pixelSize: selected ? 8 : 5,
          color: color(dark ? '#b8f7ff' : '#025f82', opacity),
          outlineColor: color(dark ? '#20c7ff' : '#dff8ff', opacity),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
    }
  }
  finally {
    collection.resumeEvents()
  }
}

function refreshScene(): void {
  if (!viewer || !regionDataSource)
    return
  applyViewerTheme()
  applyMotionPreference()
  applyRegionStyles()
  rebuildOverlays()
  viewer.scene.requestRender()
}

function isCurrentViewer(current: Viewer, currentGeneration: number): boolean {
  return viewer === current && generation === currentGeneration && !current.isDestroyed()
}

function indexRegionEntities(current: Viewer, dataSource: GeoJsonDataSource): void {
  regionEntities.clear()
  for (const entity of dataSource.entities.values) {
    const values = entity.properties?.getValue(current.clock.currentTime) as { regionId?: string } | undefined
    const id = values?.regionId
    const sceneEntity = getSceneEntity(id)
    if (!id || sceneEntity?.kind !== 'region')
      continue
    const entities = regionEntities.get(id) ?? []
    entities.push(entity)
    regionEntities.set(id, entities)
  }
  if (regionEntities.size !== demoScene.regions.length)
    throw new Error(`省级数据加载不完整：${regionEntities.size}/${demoScene.regions.length}`)
}

function destroyViewer(): void {
  generation += 1
  cancelAnimationFrame(initializeFrame)
  initializeFrame = 0
  resizeObserver?.disconnect()
  resizeObserver = undefined
  clickHandler?.destroy()
  clickHandler = undefined

  const current = viewer
  viewer = undefined
  regionDataSource = undefined
  regionEntities.clear()
  sceneIdByEntity.clear()
  if (current && !current.isDestroyed())
    current.destroy()
}

async function initializeViewer(): Promise<void> {
  const target = mapTargetRef.value
  if (!target)
    return

  destroyViewer()
  const currentGeneration = generation
  loading.value = true
  errorMessage.value = ''

  try {
    const current = new Viewer(target, {
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrainProvider: new EllipsoidTerrainProvider(),
      skyBox: false,
      skyAtmosphere: false,
      scene3DOnly: true,
      shouldAnimate: !props.reducedMotion,
      requestRenderMode: props.reducedMotion,
      maximumRenderTimeChange: props.reducedMotion ? Number.POSITIVE_INFINITY : 0,
      targetFrameRate: 30,
    })
    viewer = current

    animationStart = JulianDate.now()
    current.clock.startTime = JulianDate.clone(animationStart)
    current.clock.currentTime = JulianDate.clone(animationStart)
    current.clock.stopTime = JulianDate.addSeconds(animationStart, 86_400, new JulianDate())
    current.clock.clockRange = ClockRange.LOOP_STOP
    current.clock.multiplier = 1

    current.scene.globe.depthTestAgainstTerrain = false
    current.scene.globe.enableLighting = false
    current.scene.fog.enabled = false
    current.scene.screenSpaceCameraController.minimumZoomDistance = 650_000
    current.scene.screenSpaceCameraController.maximumZoomDistance = 12_000_000
    applyViewerTheme()
    applyMotionPreference()

    clickHandler = new ScreenSpaceEventHandler(current.scene.canvas)
    clickHandler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer?.scene.pick(event.position) as { id?: Entity } | undefined
      const id = picked?.id ? sceneIdByEntity.get(picked.id) : undefined
      if (id && getSceneEntity(id))
        emit('select', id)
    }, ScreenSpaceEventType.LEFT_CLICK)

    resizeObserver = new ResizeObserver(() => {
      if (!isCurrentViewer(current, currentGeneration))
        return
      current.resize()
      current.scene.requestRender()
    })
    resizeObserver.observe(target)

    const dataSource = await GeoJsonDataSource.load(regionGeoJson, {
      clampToGround: false,
      stroke: color('#20c7ff', 0.72),
      strokeWidth: 1,
      fill: color('#075071', 0.58),
    })
    if (!isCurrentViewer(current, currentGeneration))
      return

    await current.dataSources.add(dataSource)
    if (!isCurrentViewer(current, currentGeneration))
      return

    regionDataSource = dataSource
    indexRegionEntities(current, dataSource)
    refreshScene()
    current.camera.setView({
      destination: Cartesian3.fromDegrees(102.5, 20, CAMERA_HEIGHT),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-78),
        roll: 0,
      },
    })
    current.scene.requestRender()
    loading.value = false
  }
  catch (error) {
    if (generation !== currentGeneration)
      return
    const message = error instanceof Error ? error.message : 'Cesium 地图初始化失败'
    destroyViewer()
    errorMessage.value = message
    loading.value = false
  }
}

watch(
  () => [
    props.selectedIds.join(','),
    props.focusedId,
    props.filterStatus,
    props.theme,
    props.reducedMotion,
  ],
  refreshScene,
)

onMounted(() => {
  initializeFrame = requestAnimationFrame(() => {
    void nextTick(() => {
      void initializeViewer()
    })
  })
})

onBeforeUnmount(destroyViewer)
</script>

<template>
  <div
    class="cesium-center"
    data-center-renderer="cesium"
    :aria-busy="loading"
  >
    <div
      ref="mapTargetRef"
      class="cesium-center__map"
      role="img"
      aria-label="全国运行态势 Cesium 三维飞线图"
    />
    <div v-if="loading" class="cesium-center__state" role="status">
      Cesium 三维态势载入中
    </div>
    <div v-else-if="errorMessage" class="cesium-center__state cesium-center__state--error" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" @click="initializeViewer">
        重新加载
      </button>
    </div>
  </div>
</template>

<style scoped>
.cesium-center,
.cesium-center__map {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.cesium-center {
  position: relative;
  overflow: hidden;
}

.cesium-center__map :deep(.cesium-viewer),
.cesium-center__map :deep(.cesium-viewer-cesiumWidgetContainer),
.cesium-center__map :deep(.cesium-widget),
.cesium-center__map :deep(canvas) {
  width: 100%;
  height: 100%;
}

.cesium-center__map :deep(.cesium-widget-credits) {
  right: auto;
  bottom: 6px;
  left: 8px;
  opacity: 0.58;
  transform: scale(0.82);
  transform-origin: left bottom;
}

.cesium-center__state {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--luma-cockpit-map-mask), transparent 16%);
  color: var(--luma-cockpit-text-secondary);
  pointer-events: none;
}

.cesium-center__state--error {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.cesium-center__state button {
  min-width: 88px;
  min-height: 44px;
  border: 1px solid var(--luma-cockpit-accent);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: var(--luma-cockpit-title-text);
  cursor: pointer;
}

.cesium-center__state button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
