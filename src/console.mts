import {readFileSync} from 'fs'
import {program} from 'commander'
import {KtClass, KtContext} from "./lib/domain.mts";
import {search, select} from '@inquirer/prompts';
import assert from 'assert';
import {distinct} from './lib/utils.mts'
import {describeFLow, describeFlowPrompt, writeTests, writeTestsPrompt} from './lib/llm.mts';
import terminalKit from 'terminal-kit';
const {terminal} = terminalKit;

const {version} = JSON.parse(readFileSync('./package.json', 'utf-8'))
let ktContext: KtContext | undefined = undefined;
let classes: KtClass[] = []

program
    .name('doc4k')
    .description('A sample interactive CLI app using commander')
    .version(version)

program
    .command('base <path>')
    .description('The base path of the project that you want to analyze.')
    .action((path) => {
        if (ktContext) {
            console.log('Context already initialized.')
            return
        }

        if (path === '.') path = process.cwd()

        console.log(`Initializing KtContext for path: ${path}`)
        ktContext = new KtContext(path)
    })


program
    .command('exit')
    .description('Exit the program')

program.parse(process.argv)

console.log(`Welcome to @Doc4k :: v${version}`)

export async function run() {
    // noinspection InfiniteLoopJS
    while (true) {
        let _file = await search({
            message: 'Select a class:',
            source: async (input) => {
                if (!classes.length) classes = ktContext?.files.flatMap(f => f.classes) ?? []

                if (!input) {
                    return classes.map(c => {
                        return {
                            name: `${c.packageName}.${c.name}`,
                            value: `${c.file.filePath}::${c.name}`,
                            description: c.docs()
                        }
                    }).slice(0, 20)
                }
                return classes
                    .filter(c => c.name.toLowerCase().includes(input.toLowerCase()))
                    .map(c => {
                        return {
                            name: `${c.packageName}.${c.name}`,
                            value: `${c.file.filePath}::${c.name}`,
                            description: c.docs()
                        }
                    }).slice(0, 20)
            }
        })

        const [filePath, className] = _file.split('::')
        assert(ktContext)
        const ktFile = (ktContext as KtContext).files.find(f => f.filePath === filePath)
        assert(ktFile)
        const ktClass = ktFile.classes.find(c => c.name === className)
        assert(ktClass)

        let _fun = await search({
            message: 'Select a function:',
            source: async (input) => {
                if (!input) {
                    return ktClass.functions.map(f => {
                        return {
                            value: `${ktClass.name}::${f.name}`,
                            description: `\n${f.documentation ?? 'No documentation available.'}\n`
                        }
                    }).slice(0, 50)
                }
                return ktClass.functions
                    .filter(f => f.name.toLowerCase().includes(input.toLowerCase()))
                    .map(f => {
                        return {
                            value: `${ktClass.name}::${f.name}`,
                            description: `\n${f.documentation ?? 'No documentation available.'}\n`
                        }
                    }).slice(0, 50)
            }
        })

        const [_, funName] = _fun.split('::')
        const ktFunction = ktClass.functions.find(f => f.name === funName)
        assert(ktFunction)

        // Trace flow.
        assert(ktContext)
        const flow = (ktContext as KtContext).flowOf(ktFunction, ktClass)
        const distinctFuns = distinct(flow, f => f.root.text)

        const _flow = await select({
            message: 'Select operation to run:',
            choices: [
                {
                    name: 'write-tests',
                    value: 'write-tests',
                    description: `\nWrite tests for the selected flow, starting from the selected function.\nPrompt: \n\n${writeTestsPrompt}`,
                },
                {
                    name: 'describe-flow',
                    value: 'describe-flow',
                    description: `\nDescribe the selected flow, starting from the selected function.\nPrompt: \n\n${describeFlowPrompt}`,
                },
                {
                    name: 'reset',
                    value: 'reset',
                    description: '\nStart over.',
                },
            ],
        })

        const spinner = await terminal.spinner()
        terminal(` Generating response... \n`)
        switch (_flow) {
            case 'write-tests':
                await writeTests(ktFunction, distinctFuns)
                break
            case 'describe-flow':
                await describeFLow(ktFunction, distinctFuns)
        }
        spinner.animate(false)
    }
}