declare module 'markdown-it-footnote'
declare module 'markdown-it-task-lists'
declare module 'markdown-it-deflist'
declare module 'chartjs-plugin-trendline'
declare module 'chartjs-adapter-date-fns'
declare module '@shikijs/markdown-it' {
  const factory: (opts: any) => Promise<any>
  export default factory
}
