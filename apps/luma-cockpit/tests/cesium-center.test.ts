import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CesiumCenter from '../src/centers/cesium-center/Center.vue'
import { demoScene } from '../src/data/demo-scene'

const cesiumMocks = vi.hoisted(() => ({
  clickCallback: undefined as ((event: { position: unknown }) => void) | undefined,
  dataSourceAdd: vi.fn(),
  handlerDestroy: vi.fn(),
  load: vi.fn(),
  observerDisconnect: vi.fn(),
  requestRender: vi.fn(),
  viewer: undefined as any,
  viewerDestroy: vi.fn(),
}))

vi.mock('cesium', () => {
  class FakeJulianDate {
    seconds: number

    constructor(seconds = 0) {
      this.seconds = seconds
    }

    static now(): FakeJulianDate {
      return new FakeJulianDate(100)
    }

    static clone(value: FakeJulianDate): FakeJulianDate {
      return new FakeJulianDate(value.seconds)
    }

    static addSeconds(value: FakeJulianDate, seconds: number, result: FakeJulianDate): FakeJulianDate {
      result.seconds = value.seconds + seconds
      return result
    }

    static secondsDifference(left: FakeJulianDate, right: FakeJulianDate): number {
      return left.seconds - right.seconds
    }
  }

  class FakeColor {
    alpha = 1

    static fromCssColorString(): FakeColor {
      return new FakeColor()
    }

    withAlpha(alpha: number): FakeColor {
      const result = new FakeColor()
      result.alpha = alpha
      return result
    }
  }

  class FakeCartesian2 {
    constructor(public x = 0, public y = 0) {}
  }

  class FakeCartesian3 {
    constructor(public x = 0, public y = 0, public z = 0) {}

    static fromDegrees(longitude: number, latitude: number, height: number): FakeCartesian3 {
      return new FakeCartesian3(longitude, latitude, height)
    }

    static lerp(start: FakeCartesian3, end: FakeCartesian3, amount: number, result: FakeCartesian3): FakeCartesian3 {
      result.x = start.x + (end.x - start.x) * amount
      result.y = start.y + (end.y - start.y) * amount
      result.z = start.z + (end.z - start.z) * amount
      return result
    }
  }

  class FakeGraphics {
    constructor(options: Record<string, unknown>) {
      Object.assign(this, options)
    }
  }

  class FakeEntityCollection {
    values: any[] = []

    add(options: Record<string, unknown>): any {
      const entity = { ...options }
      this.values.push(entity)
      return entity
    }

    removeAll(): void {
      this.values = []
    }

    suspendEvents(): void {}
    resumeEvents(): void {}
  }

  class FakeScreenSpaceEventHandler {
    constructor(_canvas: HTMLCanvasElement) {}

    setInputAction(callback: (event: { position: unknown }) => void): void {
      cesiumMocks.clickCallback = callback
    }

    destroy(): void {
      cesiumMocks.handlerDestroy()
    }
  }

  class FakeViewer {
    camera = { setView: vi.fn() }
    clock = {
      clockRange: 0,
      currentTime: new FakeJulianDate(),
      multiplier: 1,
      shouldAnimate: false,
      startTime: new FakeJulianDate(),
      stopTime: new FakeJulianDate(),
    }

    dataSources = {
      add: async (dataSource: unknown) => {
        cesiumMocks.dataSourceAdd(dataSource)
        return dataSource
      },
    }

    entities = new FakeEntityCollection()
    options: Record<string, unknown>
    destroyed = false
    resize = vi.fn()
    scene: any

    constructor(container: HTMLElement, options: Record<string, unknown>) {
      this.options = options
      const canvas = document.createElement('canvas')
      container.append(canvas)
      this.scene = {
        backgroundColor: undefined,
        canvas,
        fog: { enabled: true },
        globe: { baseColor: undefined, depthTestAgainstTerrain: true, enableLighting: true },
        maximumRenderTimeChange: 0,
        pick: vi.fn(),
        requestRender: cesiumMocks.requestRender,
        requestRenderMode: false,
        screenSpaceCameraController: { maximumZoomDistance: 0, minimumZoomDistance: 0 },
      }
      cesiumMocks.viewer = this
    }

    destroy(): void {
      this.destroyed = true
      cesiumMocks.viewerDestroy()
    }

    isDestroyed(): boolean {
      return this.destroyed
    }
  }

  return {
    ArcType: { NONE: 0 },
    CallbackPositionProperty: FakeGraphics,
    Cartesian2: FakeCartesian2,
    Cartesian3: FakeCartesian3,
    ClockRange: { LOOP_STOP: 0 },
    Color: FakeColor,
    DistanceDisplayCondition: FakeGraphics,
    EllipsoidTerrainProvider: class {},
    GeoJsonDataSource: { load: (...args: unknown[]) => cesiumMocks.load(...args) },
    HorizontalOrigin: { CENTER: 0 },
    JulianDate: FakeJulianDate,
    LabelStyle: { FILL_AND_OUTLINE: 0 },
    Math: { toRadians: (value: number) => value * Math.PI / 180 },
    PolygonGraphics: FakeGraphics,
    PolylineGlowMaterialProperty: FakeGraphics,
    ScreenSpaceEventHandler: FakeScreenSpaceEventHandler,
    ScreenSpaceEventType: { LEFT_CLICK: 0 },
    VerticalOrigin: { BOTTOM: 0 },
    Viewer: FakeViewer,
  }
})

class ResizeObserverStub {
  observe(): void {}

  disconnect(): void {
    cesiumMocks.observerDisconnect()
  }
}

function createRegionDataSource(data: { features: Array<{ properties: Record<string, unknown> }> }) {
  return {
    entities: {
      values: data.features.map(feature => ({
        polygon: { hierarchy: {} },
        properties: { getValue: () => feature.properties },
      })),
    },
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => {
    resolve = next
  })
  return { promise, resolve }
}

describe('cesium 中央地图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cesiumMocks.clickCallback = undefined
    cesiumMocks.viewer = undefined
    cesiumMocks.load.mockImplementation(async (data: any) => createRegionDataSource(data))
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('加载共享场景、响应点击和动效设置，并完整释放资源', async () => {
    const wrapper = mount(CesiumCenter, {
      props: {
        selectedIds: [],
        focusedId: '',
        theme: 'dark',
        reducedMotion: false,
      },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()

    expect(cesiumMocks.load).toHaveBeenCalledOnce()
    expect(cesiumMocks.load.mock.calls[0][0].features).toHaveLength(demoScene.regions.length)
    expect(cesiumMocks.dataSourceAdd).toHaveBeenCalledOnce()
    expect(wrapper.attributes('aria-busy')).toBe('false')
    expect(cesiumMocks.viewer.options.baseLayer).toBe(false)
    expect(cesiumMocks.viewer.entities.values).toHaveLength(34 + 10 + 33 * 2)

    const beijingPoint = cesiumMocks.viewer.entities.values.find((entity: any) => entity.id === 'cesium-point-p-beijing')
    cesiumMocks.viewer.scene.pick.mockReturnValue({ id: beijingPoint })
    cesiumMocks.clickCallback?.({ position: {} })
    await nextTick()
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['p-beijing'])

    const currentViewer = cesiumMocks.viewer
    await wrapper.setProps({ selectedIds: ['p-beijing'], focusedId: 'p-beijing', reducedMotion: true })
    expect(cesiumMocks.viewer).toBe(currentViewer)
    expect(currentViewer.clock.shouldAnimate).toBe(false)
    expect(currentViewer.scene.requestRenderMode).toBe(true)

    wrapper.unmount()
    expect(cesiumMocks.handlerDestroy).toHaveBeenCalledOnce()
    expect(cesiumMocks.observerDisconnect).toHaveBeenCalledOnce()
    expect(cesiumMocks.viewerDestroy).toHaveBeenCalledOnce()
  })

  it('卸载后忽略尚未返回的省级数据', async () => {
    const deferred = createDeferred<ReturnType<typeof createRegionDataSource>>()
    cesiumMocks.load.mockReturnValueOnce(deferred.promise)

    const wrapper = mount(CesiumCenter, {
      props: {
        selectedIds: [],
        focusedId: '',
        theme: 'dark',
        reducedMotion: false,
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushPromises()

    expect(cesiumMocks.load).toHaveBeenCalledOnce()
    const dataSource = createRegionDataSource(cesiumMocks.load.mock.calls[0][0])
    wrapper.unmount()
    deferred.resolve(dataSource)
    await flushPromises()

    expect(cesiumMocks.dataSourceAdd).not.toHaveBeenCalled()
    expect(cesiumMocks.viewerDestroy).toHaveBeenCalledOnce()
  })
})
