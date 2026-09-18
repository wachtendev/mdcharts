declare module 'markdown-it-footnote'
declare module 'markdown-it-task-lists'
declare module 'markdown-it-deflist'
declare module 'markdown-it-container'
declare module 'echarts-wordcloud'
declare module 'echarts-liquidfill'
declare module 'topojson-client'
declare module '@shikijs/markdown-it' {
  const factory: (opts: any) => Promise<any>
  export default factory
}
