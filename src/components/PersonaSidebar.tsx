'use client'

import { Persona } from '@/types'
import { X } from 'lucide-react'

interface PersonaSidebarProps {
  personas: Persona[]
  activePersona: Persona
  onSelect: (persona: Persona) => void
  onDelete: (id: string) => void
  onClickAdd: () => void
  isOpen: boolean
  onClose: () => void
}

export default function PersonaSidebar({
  personas,
  activePersona,
  onSelect,
  onDelete,
  onClickAdd,
  isOpen,
  onClose,
}: PersonaSidebarProps) {
  const builtinPersonas = personas.filter((p) => p.isBuiltin)
  const customPersonas = personas.filter((p) => !p.isBuiltin)

  const handleSelect = (persona: Persona) => {
    onSelect(persona)
    onClose() // 手机端选完角色自动关闭抽屉
  }

  return (
    <>
      {/* 手机端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏主体 */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-52 flex flex-col
          bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex md:flex-shrink-0
        `}
      >
        <div className="px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          角色
        </div>

        {/* 角色列表 */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {builtinPersonas.map((persona) => (
            <PersonaItem
              key={persona.id}
              persona={persona}
              isActive={activePersona.id === persona.id}
              onSelect={handleSelect}
            />
          ))}

          {customPersonas.length > 0 && (
            <>
              <div className="px-2 pt-3 pb-1 text-xs text-gray-400 dark:text-gray-500">
                自定义
              </div>
              {customPersonas.map((persona) => (
                <PersonaItem
                  key={persona.id}
                  persona={persona}
                  isActive={activePersona.id === persona.id}
                  onSelect={handleSelect}
                  onDelete={onDelete}
                />
              ))}
            </>
          )}
        </div>

        {/* 新建角色按钮 */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClickAdd}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            <span>新建角色</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function PersonaItem({
  persona,
  isActive,
  onSelect,
  onDelete,
}: {
  persona: Persona
  isActive: boolean
  onSelect: (p: Persona) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div
      onClick={() => onSelect(persona)}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500 text-blue-700 dark:text-blue-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <span className="text-base flex-shrink-0">{persona.icon}</span>
      <span className="flex-1 truncate font-medium">{persona.name}</span>
      {onDelete && !persona.isBuiltin && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(persona.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition-all"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
