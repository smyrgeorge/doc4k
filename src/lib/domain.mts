import Parser, {type SyntaxNode, type Tree} from 'tree-sitter'
import Kotlin from 'tree-sitter-kotlin'
import assert from 'assert'
import fs from 'fs'
import {
    allCallStatementsOf,
    assertIsCallExpression,
    assertIsClassOrObject,
    assertIsFunction,
    assertIsSourceFile,
    childrenClassesOf,
    childrenFunctionsOf,
    classBodyOf,
    classBodyPropertiesOf,
    findRecursively,
    functionBodyOf,
    identifierOf,
    importsOf,
    isCallExpression,
    primaryConstructorOf,
    primaryConstructorParametersOf
} from './utils.mts'

export class KtContext {
    readonly baseDir: string
    readonly parser: Parser
    readonly files: KtFile[] = []

    constructor(baseDir?: string) {
        this.baseDir = (baseDir + '/').replaceAll('//', '/')
        this.parser = new Parser()
        this.parser.setLanguage(Kotlin)
        this.parse()
    }

    parse() {
        const walk = (dir: string, fileList: string[] = []): string[] => {
            fs.readdirSync(dir, {withFileTypes: true}).forEach(dirent => {
                const fullPath = dir + dirent.name
                if (dirent.isDirectory()) walk(fullPath + '/', fileList)
                else fileList.push(fullPath.replace(this.baseDir, ''))
            })
            return fileList
        }
        const start = process.hrtime()
        const files = walk(this.baseDir)
        files.forEach(f => {
            if (!f.endsWith('.kt')) return
            this.parseSingle(f)
        })
        const [s, ns] = process.hrtime(start)
        console.log('PARSED:', this.files.length, 'files in', s, 's', ns / 1e6, 'ms')
    }

    parseSingle(filePath: string): KtFile {
        filePath = this.baseDir + filePath
        const file: string = fs.readFileSync(filePath, 'utf8')
        const tree: Tree = this.parser.parse(file, undefined, {bufferSize: file.length * 2})
        const ktFile = new KtFile(filePath, tree)
        this.files.push(ktFile)
        return ktFile
    }

    findClassByName(aClass: string): { file: KtFile, aClass: KtClass } | undefined {
        const file = this.files.find(f => f.classes.find(c => c.name === aClass))
        if (!file) return undefined
        const aClassFile = file.classes.find(c => c.name === aClass)
        assert(aClassFile)
        return {file, aClass: aClassFile}
    }

    findClass(aClass: KtClass, type?: string): { file: KtFile, aClass: KtClass } | undefined {
        type = type ?? ''
        const i = aClass.file.imports.find(i => i.endsWith(type))
        const p = i ? i.replace(`.${type}`, '') : aClass.packageName
        const f = this.files.find(f => f.packageName === p && f.classes.find(c => c.name === type))
        if (!f) return this.findClassByName(type) // Fallback (search with class name only).
        const aClassFile = f.classes.find(c => c.name === type)
        assert(aClassFile)
        return {file: f, aClass: aClassFile}
    }

    flowOf(fun: KtFun, aClass: KtClass): KtFun[] {
        const start = process.hrtime()
        const flow: KtFun[] = []
        flow.push(fun)
        this._flowOf(fun, aClass, flow)
        const [s, ns] = process.hrtime(start)
        console.log('Traced flow', `'${aClass.name}.${fun.name}' in`, s, 's', ns / 1e6, 'ms')
        return flow
    }

    private _call(aClass: KtClass, fun: KtFun, targetClass: KtClass, targetFunName: string, flow: KtFun[]) {
        const targetFunctions: KtFun[] = targetClass.functions.filter(f => f.name === targetFunName)
        targetFunctions.forEach(targetFun => {
            console.log(`(${aClass.name}.${fun.name})`, 'CALL:', `${targetClass.name}.${targetFun.name}`)
            flow.push(targetFun)
            this._flowOf(targetFun, targetClass, flow)
        })
    }

    private _navigation(s: SyntaxNode, fun: KtFun, aClass: KtClass, flow: KtFun[]) {
        const expr = s.firstChild?.text
        const navigation = expr?.split('.') ?? []
        const targetFunName = navigation[1].split('(')[0]

        const classProperty = aClass.properties.find(p => p.name === navigation[0])
        if (classProperty) {
            const targetClass = this.findClass(aClass, classProperty.type)?.aClass
            if (targetClass) {
                this._call(aClass, fun, targetClass, targetFunName, flow)
                return
            }
        }

        const targetClass = this.findClass(aClass, navigation[0])?.aClass
        if (targetClass) {
            this._call(aClass, fun, targetClass, targetFunName, flow)
            return
        }
    }

    private _flowOf(fun: KtFun, aClass: KtClass, flow: KtFun[]) {
        assertIsFunction(fun.root)
        fun.callStatements.forEach(s => {
            assertIsCallExpression(s)

            if (s.firstChild?.grammarType === 'navigation_expression') {
                this._navigation(s, fun, aClass, flow)
                return
            }

            const targetFunName = identifierOf(s)
            if (!targetFunName) return // Case imported static fun.
            if (targetFunName === fun.name) return // Recursive calls.
            this._call(aClass, fun, aClass, targetFunName, flow)
        })
    }
}

export class KtFile {
    readonly tree: Tree
    readonly root: SyntaxNode
    readonly filePath: string
    readonly packageName: string
    readonly imports: String[]
    readonly classes: KtClass[]
    readonly functions: KtFun[]

    constructor(filePath: string, tree: Tree) {
        this.tree = tree
        this.root = this.tree.walk().currentNode
        assertIsSourceFile(this.root)
        this.filePath = filePath
        this.packageName = findRecursively('package_header', this.root)?.text?.replace('package ', '') ?? ''
        this.imports = importsOf(this.root).map(i => i.text.replace('import ', ''))
        this.classes = childrenClassesOf(this.root).map(c => new KtClass(c[0], this, this.packageName, c[1]))
        this.functions = childrenFunctionsOf(this.root).map(f => new KtFun(f[0], this, f[1], undefined))
    }
}

export class KtClass {
    readonly root: SyntaxNode
    readonly name: string
    readonly file: KtFile
    readonly packageName: string
    readonly isObject: boolean
    readonly documentation?: string
    readonly properties: KtProperty[] = []
    readonly classes: KtClass[] = []
    readonly functions: KtFun[] = []

    constructor(root: SyntaxNode, file: KtFile, packageName: string, documentation?: string) {
        this.root = root
        assertIsClassOrObject(this.root)
        this.file = file
        this.packageName = packageName
        this.isObject = this.root.grammarType === 'object_declaration'
        this.documentation = documentation
        this.name = identifierOf(this.root) ?? ''
        assert(this.name.length)

        let primaryConstructorParameters: KtProperty[] = []
        const primaryConstructor = primaryConstructorOf(this.root)
        if (primaryConstructor) {
            primaryConstructorParameters = primaryConstructorParametersOf(primaryConstructor)
                .map(p => new KtProperty(p))
        }

        let bodyProperties: KtProperty[] = []
        const body = classBodyOf(this.root)
        if (body) {
            this.functions = childrenFunctionsOf(body).map(f => new KtFun(f[0], this.file, f[1], this))
            bodyProperties = classBodyPropertiesOf(body).map(p => new KtProperty(p))
            this.classes = childrenClassesOf(body).map(c => new KtClass(c[0], this.file, this.packageName, c[1]))
        }

        this.properties = [...primaryConstructorParameters, ...bodyProperties]
    }

    docs(): string {
        const type = this.isObject ? 'object' : 'class'
        const doc = this.documentation ? `${this.documentation}` : ''
        return `\n${this.packageName}\n\n${doc}\n${type} ${this.name} { ... }`
    }
}

export class KtFun {
    readonly root: SyntaxNode
    readonly name: string
    readonly file: KtFile
    readonly documentation?: string
    readonly class?: KtClass
    readonly callStatements: SyntaxNode[] = []

    constructor(root: SyntaxNode, file: KtFile, documentation?: string, aClass?: KtClass) {
        this.root = root
        this.file = file
        this.documentation = documentation
        this.class = aClass
        this.name = identifierOf(this.root) ?? ''
        assert(this.name.length)
        const body = functionBodyOf(this.root)
        if (!body) return // Case interface (or abstract class).
        const statements = allCallStatementsOf(body)
        assert(body.lastChild)
        if (!statements.length) {
            if (isCallExpression(body.lastChild)) statements.push(body.lastChild)
        } // Function with one statement (using '=').
        this.callStatements = statements
    }

    text(): string {
        const split = this.root.text.split('\n')
        assert(split.length >= 1)
        const ident = this.class ? '    ' : ''
        const doc = this.documentation ? `${ident}${this.documentation}\n` : ''
        const code = `${ident}${this.root.text}`
        return `${doc}${code}`.split('\n').map(l => l.replace(ident, '')).join('\n')
    }
}

export class KtProperty {
    readonly root: SyntaxNode
    readonly name: string
    readonly type: string

    constructor(root: SyntaxNode) {
        this.root = root

        let parse: SyntaxNode | undefined = this.root
        if (this.root.grammarType == 'property_declaration') {
            parse = this.root.children.find(n => n.grammarType === 'variable_declaration')
            assert(parse)
        }

        this.name = identifierOf(parse) ?? ''
        assert(this.name.length)
        const type = parse?.children.find(n => n.grammarType === 'user_type')
        if (type) this.type = type.text
        else this.type = 'UNKNOWN'
        assert(this.type)
    }
}