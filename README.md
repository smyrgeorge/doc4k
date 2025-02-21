# Doc4k

`Doc4k` is an interactive CLI tool designed for analyzing large Kotlin projects. It provides features to
support tracing execution flows, summarizing code, and generating test cases effectively for Kotlin codebases.

This project leverages the Tree-sitter parser to efficiently and quickly parse large Kotlin codebases.

> [!IMPORTANT]  
> The project is nowhere close to production ready state.
> It's just a proof of concept for now.

## How it works

1. **Codebase Representation**: The tool creates an in-memory representation of the entire Kotlin codebase for efficient
   analysis.
2. **Codebase Crawling**: It traces the execution flow by allowing the user to select an entry point (a specific
   function). From that entry point, the tool identifies and follows all function calls across the codebase.
3. **LLM Analysis**: After gathering the flow of functions, the tool filters out only the necessary functions and sends
   them to a language model (LLM) for analysis using a defined prompt.

This method is highly effective because it provides a more specific and focused context to the LLM for the requested
analysis. Instead of sending entire files, which can include a significant amount of irrelevant or unnecessary
information, this approach isolates only the functions involved in the execution flow. By narrowing down the context,
the tool significantly reduces the amount of input tokens required for the analysis.

This efficiency not only makes the interaction with the LLM faster and more cost-effective (due to reduced token usage)
but also enhances the precision of the analysis by ensuring that only the most relevant parts of the codebase are
considered. This targeted approach allows the LLM to focus on the exact scope of the problem or functionality without
being overwhelmed by unrelated code.

## Todo

- [ ] Rewrite the tool in Kotlin
- [ ] Convenient way to change model
- [ ] Add support for other languages
- [ ] Write an intelliJ plugin.

## Usage

```shell
# First you need to download all the dependencies.
npm install
```

Run the script and set the base search path. The tool will quickly scan and parse all the `.kt` files that will find
under this directory (and all subdirectories).

```shell
# Also you will also have to your OpenApi key as environment variable.
OPENAI_API_KEY=<MY_SECRET_KEY>
./index.ts base ~/path/to/a/kotlin/project
```

## Demo

[![asciicast](https://asciinema.org/a/SZVhuWbNzLw2E989gKU1jI6S6.svg)](https://asciinema.org/a/SZVhuWbNzLw2E989gKU1jI6S6)