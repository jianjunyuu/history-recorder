import { Stack } from './stack'

let _uuid = 0
const _history = new Stack<typeof _uuid>()
const _poped = new Stack<typeof _uuid>()
const _executes = new Map<typeof _uuid, { state: any; action: (state: any) => any }>()
const _reverts = new Map<typeof _uuid, { state: any; action: (state: any) => any }>()

export function createRecord() {
  // 检测之前的记录是否执行了 `execute` `revert`
  const preUuid = _history.peek()
  if (preUuid && (!_executes.has(preUuid) || !_reverts.has(preUuid)))
    throw new Error(`Records with uuid ${preUuid} do not have execute or revert set.`)

  // 有新纪录时候，清空返回的操作历史
  _poped.clear()
  const uuid = _uuid++
  _history.push(uuid)
  function execute<T, U>(state: T, action: (state: T) => U): U {
    _executes.set(uuid, {
      state,
      action,
    })
    return action(state)
  }

  function revert<T, U>(state: T, action: (state: T) => U): void {
    _reverts.set(uuid, {
      state,
      action,
    })
  }
  return { execute, revert }
}

export function useRecorder() {
  function forward() {
    const uuid = _poped.pop()
    if (typeof uuid !== 'undefined') {
      _history.push(uuid)
      const executor = _executes.get(uuid)
      executor?.action(executor.state)
    }
  }
  function back() {
    const preUuid = _history.peek()

    if (typeof preUuid !== 'undefined') {
      _poped.push(_history.pop()!)
      const revert = _reverts.get(preUuid)
      revert?.action(revert.state)
    }
  }

  return { forward, back }
}
