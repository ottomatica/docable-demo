import { ls, exit } from 'shelljs'
import { parse, toMd, render } from './remark.v2'
import { promises } from 'fs'
import path from 'path'
import commander from 'commander'
const testreport = require('./node_modules/docable/');

commander
  .version('1.0.0')
  .usage(`lintmd 'src/**/*.md'`)
  .option('--write', 'Write the parsed file in place')
  .parse(process.argv)

commander.on('command:*', async (paths: string[] | undefined) => {
  
  if (!paths || paths.length === 0) {
    commander.help()
    exit(1)
    return
  }

  for(let it of ls(paths).filter(path => path.includes('.md'))) {
    const content = await promises.readFile(path.resolve(paths[0], it), 'utf8')
    const parsedContent = toMd(parse(content))
    
    // console.log('parse => ', JSON.stringify(parse(content)))
    // console.log('==============')
    // console.log('toMD => ', parsedContent);
    
    if (content === parsedContent) {
      console.log(`${it} ✅`)
      // return
    }
    if (content !== parsedContent && commander.write) {
      console.log(`${it} ✏️`)
      await promises.writeFile(it, parsedContent)
      return
    }
    console.log(`lintmd result: ${it} ❌`)
    // exit(1)
  }
  await testreport("report", {stepfile: path.join(paths[0], 'steps.yml')});
})

commander.on('command:render', (paths: string[] | undefined) => {
  if (!paths || paths.length === 0) {
    commander.help()
    exit(1)
    return
  }
  ls(paths).forEach(async it => {
    let renderedHTML = render(it);
    // promises.writeFile('test.json', JSON.stringify(renderedHTML))
    promises.writeFile(path.join(process.cwd(), path.basename(it)+'.html'), renderedHTML.props.dangerouslySetInnerHTML.__html)
  })

  testreport();
})

commander.parse(process.argv)

if (commander.args.length === 0) {
  commander.help()
}
