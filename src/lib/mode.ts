/** 模式定义：浏览 / 拾取（选点）/ 编辑（管理表单） */
export type Mode = 'browse' | 'pick' | 'edit'

/** 左侧面板槽位视图 */
export type PanelView = 'index' | 'detail' | 'editor'

/** 拾取目标：拾取的坐标回填到哪儿 */
export type PickTarget =
  | { kind: 'free' }
  | { kind: 'editor' }
  | { kind: 'origin'; stationId: string }

export const MODE_LABEL: Record<Mode, string> = {
  browse: '浏览',
  pick: '拾取',
  edit: '编辑',
}

export const MODE_EN: Record<Mode, string> = {
  browse: 'BROWSE',
  pick: 'PICK',
  edit: 'EDIT',
}
