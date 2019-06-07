import { ls, exit } from 'shelljs'
import { parse, toMd, render } from './remark.v2'
import { promises } from 'fs'
import path from 'path'
import commander from 'commander'
require('colors');
var jsdiff = require('diff');
const testreport = require('./node_modules/docable/');

commander
  .version('1.0.0')
  .usage(`lintmd 'src/**/*.md'`)
  .option('--write', 'Write the parsed file in place')
  .option("-r, --renderer [renderer]", "Which renderer to use [renderer]")
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

    if (content === parsedContent) {
      console.log(`${it} ✅`)
      continue
    }
    if (content !== parsedContent && commander.write) {
      console.log(`${it} ✏️`)
      await promises.writeFile(it, parsedContent)
      return
    }
    await printDiff(content, parsedContent)
    console.log(`lintmd result: ${it} ❌`)
    exit(1)
  }
  
  await runDocable(paths);
})

commander.on('command:render', async (paths: string[] | undefined) => {
  if (!paths || paths.length === 0) {
    commander.help()
    exit(1)
    return
  }

  let renderedHTML:any;
  for(let it of ls(paths).filter(path => path.includes('.md'))) {
    renderedHTML = render(path.resolve(paths[0], it));
    await promises.writeFile(path.join(process.cwd(), path.basename(it)+'.html'), renderedHTML.props.dangerouslySetInnerHTML.__html)
  }

  await runDocable(paths);
})

commander.parse(process.argv)

if (commander.args.length === 0) {
  commander.help()
}

async function printDiff(string1: string, string2: string){
  var diff = jsdiff.diffChars(string1, string2)
  diff.forEach(function(part: any){
    // green for additions, red for deletions, and grey for common parts
    let color = part.added ? 'green' :
      part.removed ? 'red' : 'grey'
    process.stderr.write(part.value[color])
  });
}

async function runDocable(paths: string[]) {
  switch (commander.renderer) {
    case 'learnk8s':
      console.log(`Using renderer ⚙️ : learnk8s`)
      await testreport("report", {stepfile: path.join(paths[0], 'steps.yml')}, {parser : (file: string) => render(path.resolve(paths[0], file)).props.dangerouslySetInnerHTML.__html} );  
      break;

    default:
      console.log(`Using renderer ⚙️ : marked`)
      await testreport("report", {stepfile: path.join(paths[0], 'steps.yml')});
      break;
  }
}