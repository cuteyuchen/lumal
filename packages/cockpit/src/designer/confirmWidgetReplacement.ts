import { ElMessageBox } from 'element-plus'

/***********************模块替换确认*********************/

export async function confirmWidgetReplacement(): Promise<boolean> {
  try {
    await ElMessageBox.confirm('目标槽位已有模块，是否替换？', '确认替换', {
      cancelButtonText: '取消',
      confirmButtonText: '替换',
      type: 'warning',
    })
    return true
  }
  catch {
    return false
  }
}

