# Doc4k

`Doc4k` is a TypeScript-based interactive CLI tool designed for analyzing large Kotlin projects. It provides features to
support tracing execution flows, summarizing code, and generating test cases effectively for Kotlin codebases.

This project leverages libraries like `tree-sitter-kotlin` for parsing Kotlin source files and OpenAI's `LangChain` for
summarization and test generation.

## Features

- **Kotlin Project Parsing**  
  Automatically parses Kotlin files of a given project directory.
    - Processes classes, methods, and their interrelations.
    - Extracts imports, class definitions, method definitions, and more.

- **Execution Flow Description**  
  Using OpenAI's GPT models (`gpt-4o-mini`), the tool generates:
    - Summaries of execution flows traced from Kotlin function calls.
    - Lists of validation checks and exceptions thrown during the flow.

- **Test Case Generation**  
  Automatically writes detailed test cases for the entry point and other functions of a Kotlin execution flow.

- **Interactive CLI**
    - Search and select Kotlin classes and functions.
    - Perform operations like tracing flows, generating summaries, and creating test cases interactively.

## Installation

1. Clone the repository:

```shell script
git clone <repo-url>
```

2. Install dependencies:

```shell script
npm install
```

3. Ensure you have a valid OpenAI API key to use its summarization and generation capabilities.
4. Compile the TypeScript code:

```shell script
npm run build
```

## Usage

### CLI Commands

- **Set Base Directory**  
  Initialize `Doc4k` for a specific Kotlin project directory:

```shell script
doc4k base <path>
```

Example:

```shell script
doc4k base ./kotlin-project
```

- **Interactive Mode**  
  Start an interactive session:

```shell script
node dist/index.js
```

This mode enables you to:

- Browse classes and functions interactively.
- Analyze execution flows or generate test cases for selected Kotlin elements.
- Exit the session anytime using:

```shell script
doc4k exit
```

### Flow Analysis

Once initialized, select a class and a function. `Doc4k` will trace the execution flow of the method and generate a
comprehensive summary including validation checks and exceptions thrown.

### Test Case Generation

For selected functions, you can request automatically generated test cases. These test cases include:

- Entry point test cases.
- Additional tests covering execution flow scenarios comprehensively.

## Prompts and Operations

The tool uses specially designed prompts for interacting with OpenAI's GPT models. Two core prompts,
`describeFlowPrompt` and `writeTestsPrompt`, facilitate its primary capabilities:

1. **Execution Flow Analysis Prompt (`describeFlowPrompt`)**  
   Input:
    - Function and its entire flow of dependent methods.  
      Output:
    - Execution summary.
    - Validation checks performed.
    - Exceptions thrown.

2. **Test Case Generation Prompt (`writeTestsPrompt`)**  
   Input:
    - Function and its flow of dependent methods.  
      Output:
    - Abstract flow execution summary.
    - Detailed test cases for the entry point coverage.

The results are saved in the `samples/out` directory as `.md` files for further inspection.

## Technical Design

### Workflow

1. Parse the Kotlin project directory into a `KtContext`:
    - Extract classes, functions, imports, and syntax trees.
2. Search/select a class and function:
    - Select operation (`trace flow` or `generate tests`).
3. Trace execution flow through method calls:
    - Accumulate functions called directly or indirectly.
4. Summarize the execution or generate test cases through OpenAI prompts.
5. Save outputs in markdown format for review.

## Technologies Used

- **Programming Language**: TypeScript
- **Parser**: `tree-sitter-kotlin`
- **CLI Framework**: Commander.js
- **Prompt Toolkit**: `@inquirer/prompts`, `terminal-kit`
- **AI Model Integration**: OpenAI via `langchain`

---

## Examples

### Trace Execution Flow Example

The following command initializes the `doc4k` tool and traces the flow of a specific function:

```shell script
node dist/index.js  # Start Doc4k
```

In the interactive mode:

1. Select a Kotlin class.
2. Select a method.
3. Trigger "trace flow" action.

Output:  
**Markdown file in `samples/out/describe-flow.md` containing:**

- Function execution summary
- Validation checks
- Exceptions thrown

### Generate Test Cases Example

In the interactive mode:

1. Select a Kotlin class.
2. Select a method.
3. Trigger "Generate test cases" action.

Output:  
**Markdown file in `samples/out/write-tests.md` containing:**

- Function execution summary
- Unit test cases.

---

## Future Improvements

- Extend language support beyond Kotlin (e.g., Java).
- Add support for validating OpenAI responses using schema validation.
- Provide more configurable CLI options for prompt customizations.
- Include better visualization for execution flows directly in CLI.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Author

Created by **Yorgos Smyrnaios**.  
For any inquiries or contributions, feel free to reach out!


