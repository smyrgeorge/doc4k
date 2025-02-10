import assert from 'assert'
import type {SyntaxNode} from 'tree-sitter'

export function isSourceFile(node: SyntaxNode): boolean {
    return node.grammarType === 'source_file'
}

export function isImportList(node: SyntaxNode): boolean {
    return node.grammarType === 'import_list'
}

export function isClass(node: SyntaxNode): boolean {
    return node.grammarType === 'class_declaration'
}

export function isObject(node: SyntaxNode): boolean {
    return node.grammarType === 'object_declaration'
}

export function isClassParameter(node: SyntaxNode): boolean {
    return node.grammarType === 'class_parameter'
}

export function isClassProperty(node: SyntaxNode): boolean {
    return node.grammarType === 'property_declaration'
}

export function isClassPrimaryConstructor(node: SyntaxNode): boolean {
    return node.grammarType === 'primary_constructor'
}

export function isClassBody(node: SyntaxNode): boolean {
    return node.grammarType === 'class_body'
}

export function isFunction(node: SyntaxNode): boolean {
    return node.grammarType === 'function_declaration'
}

export function isMultilineComment(node: SyntaxNode): boolean {
    return node.grammarType === 'multiline_comment'
}

export function isLineComment(node: SyntaxNode): boolean {
    return node.grammarType === 'line_comment'
}

export function isComment(node: SyntaxNode): boolean {
    return isMultilineComment(node) || isLineComment(node)
}

export function isCallExpression(node: SyntaxNode): boolean {
    return node.grammarType === 'call_expression'
}

export function assertIsClassOrObject(node: SyntaxNode): void {
    assert(isClass(node) || isObject(node), `class_declaration was expected, got ${node.grammarType} (${node.text})`)
}

export function assertIsClassPrimaryConstructor(node: SyntaxNode): void {
    assert(isClassPrimaryConstructor(node), `primary_constructor was expected, got ${node.grammarType} (${node.text})`)
}

export function assertIsClassBody(node: SyntaxNode): void {
    assert(isClassBody(node), `class_body was expected, got ${node.grammarType} (${node.text})`)
}

export function assertIsSourceFile(node: SyntaxNode): void {
    assert(isSourceFile(node), `source_file was expected, got ${node.grammarType} (${node.text})`)
}

export function assertIsFunction(node: SyntaxNode): void {
    assert(isFunction(node), `function_declaration was expected, got ${node.grammarType} (${node.text})`)
}

export function assertIsCallExpression(node: SyntaxNode): void {
    assert(isCallExpression(node), `call_expression was expected, got ${node.grammarType} (${node.text})`)
}

export function importsOf(sourceFile: SyntaxNode): SyntaxNode[] {
    assertIsSourceFile(sourceFile)
    const importList = sourceFile.children.find(c => isImportList(c))
    if (importList) return importList.children; else return [];
}

export function childrenClassesOf(node: SyntaxNode): [SyntaxNode, string | undefined][] {
    const nodes = node.children
    const result: [SyntaxNode, string | undefined][] = []
    for (let i = 0; i < nodes.length; i++) {
        if (isClass(nodes[i]) || isObject(nodes[i])) {
            let maybeComment = i > 0 && isComment(nodes[i - 1]) ? nodes[i - 1] : undefined
            if (!maybeComment) {
                // Sometimes we need to search in the import list (maybe this is a bug of the parser).
                const maybeImportList = i > 0 && isImportList(nodes[i - 1]) ? nodes[i - 1] : undefined
                if (maybeImportList) {
                    maybeComment = findRecursively('line_comment', maybeImportList)
                    if (!maybeComment) {
                        maybeComment = findRecursively('multiline_comment', maybeImportList)
                    }
                }
            }
            result.push([nodes[i], maybeComment?.text])
        }
    }
    return result
}

export function childrenFunctionsOf(node: SyntaxNode): [SyntaxNode, string | undefined][] {
    const nodes = node.children
    const result: [SyntaxNode, string | undefined][] = []
    for (let i = 0; i < nodes.length; i++) {
        if (isFunction(nodes[i])) {
            const maybeComment = i > 0 && isComment(nodes[i - 1]) ? nodes[i - 1] : undefined
            result.push([nodes[i], maybeComment?.text])
        }
    }
    return result
}

export function primaryConstructorParametersOf(primaryConstructor: SyntaxNode): SyntaxNode[] {
    assertIsClassPrimaryConstructor(primaryConstructor)
    return primaryConstructor.children.filter(c => isClassParameter(c))
}

export function classBodyPropertiesOf(classBody: SyntaxNode): SyntaxNode[] {
    assertIsClassBody(classBody)
    return classBody.children.filter(c => isClassProperty(c))
}

export function primaryConstructorOf(aClass: SyntaxNode): SyntaxNode | undefined {
    assertIsClassOrObject(aClass)
    return aClass.children.find(c => c.grammarType === 'primary_constructor')
}

export function classBodyOf(aClass: SyntaxNode): SyntaxNode | undefined {
    assertIsClassOrObject(aClass)
    return aClass.children.find(c => c.grammarType === 'class_body')
}

export function functionBodyOf(fun: SyntaxNode): SyntaxNode | undefined {
    assertIsFunction(fun)
    return fun.children.find(c => c.grammarType === 'function_body')
}

export function allCallStatementsOf(node: SyntaxNode, acc: SyntaxNode[] = []): SyntaxNode[] {
    if (isCallExpression(node)) acc.push(node)
    node.children.forEach(c => allCallStatementsOf(c, acc))
    return acc;
}

export function findRecursively(grammarType: string, node: SyntaxNode): SyntaxNode | undefined {
    if (node.grammarType === grammarType) return node
    for (const c of node.children) {
        const found = findRecursively(grammarType, c)
        if (found) return found;
    }
}

export function identifierOf(node: SyntaxNode): string | undefined {
    return node.children.find(c => c.grammarType === 'simple_identifier')?.text
}

export function functionHasAnnotation(fun: SyntaxNode, annotation: string): boolean {
    assertIsFunction(fun)
    const modifiers: SyntaxNode[] = fun.children.filter(c => c.grammarType === 'modifiers')
    return modifiers.some(m => m.text.includes(annotation))
}

export const distinct = <T,>(array: T[], keyFn: (item: T) => any) => {
    const seen = new Set()
    return array.filter(item => {
        const key = keyFn(item)
        if (seen.has(key)) {
            return false
        }
        seen.add(key)
        return true
    })
}


