let sequence = 0

// 整个夹具共用递增序号，缓存返回时重建实例会得到不同 ID。
export function nextFixtureInstanceId() {
  return ++sequence
}
