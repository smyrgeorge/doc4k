import {ChatOpenAI} from '@langchain/openai'
import type {KtFun} from './domain.js'
import fs from 'fs'

const gpt = new ChatOpenAI({
    // model: 'gpt-4o',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    // maxRetries: 2,
    // streaming: true
})

// const ollama = new ChatOllama({
//     model: 'deepseek-r1',
//     temperature: 0,
//     // maxRetries: 2,
// })

export const describeFlowPrompt =
    `
        Below is a list functions of a large Kotlin project.
        The project consists a claims management project.
        I want you to take a look at the functions provided and provide me a summary of the execution flow.
        Start looking from the '<fun>' function.
        Please provide also the following information:
          - a list with all validations checks that are performed.
          - were there any exceptions thrown?
          
        Here are the functions:
        
    `

export async function describeFLow(fun: KtFun, flow: KtFun[]) {
    const prompt = describeFlowPrompt.replace('<fun>', fun.name)
    const req = [prompt, ...flow.map(f => f.text())]
    const res = await gpt.invoke(req)
    const content = res.content.toString()

    const out = 'samples/out/describe-flow.md'
    fs.writeFileSync(out, content, 'utf8')
    console.log(`=== Content has been also written to ${out} ===`)
    console.log('=== GPT RESPONSE ===')
    console.log(res)
    console.log(content)
}

export const writeTestsPrompt =
    `
        Below is a list functions of a large Kotlin project.
        The project consists a claims management project.
        Start looking from the '<fun>' function.
        I want you to take a look at the functions provided and provide me a small and abstract summary of the execution flow.
        I also want you to write me extensive tests for this flow, especially for the entry point of the flow. 
          
        Here are the functions:
        
    `

export async function writeTests(fun: KtFun, flow: KtFun[]) {
    const prompt = writeTestsPrompt.replace('<fun>', fun.name)
    const req = [prompt, ...flow.map(f => f.text())]
    const res = await gpt.invoke(req)
    const content = res.content.toString()

    const out = 'samples/out/write-tests.md'
    fs.writeFileSync(out, content, 'utf8')
    console.log(`=== Content has been also written to ${out} ===`)
    console.log('=== GPT RESPONSE ===')
    console.log(res)
    console.log(content)
}
