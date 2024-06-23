import { NodeType, NodeProp } from "@lezer/common";
import { parser } from "@plutojl/lezer-julia";
import { continuedIndent, indentNodeProp, LanguageSupport, LRLanguage } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import * as autocomplete from "@codemirror/autocomplete";

type SyntaxConfig = {
    keywords: NodeType[];
};

function getSyntaxConfig(): SyntaxConfig {
    let syntaxConfig: SyntaxConfig = {
        keywords: [],
    };

    for (let node of parser.nodeSet.types) {
        // Collect keywords
        let groups = node.prop(NodeProp.group);
        let group = groups != null ? groups[0] : null;
        if (group === "keyword") {
            syntaxConfig.keywords.push(node);
        }
    }

    return syntaxConfig;
}

let syntaxConfig = getSyntaxConfig();

console.log(
    `syntaxConfig.keywords.map((t) => t.name):`,
    syntaxConfig.keywords.map((t) => t.name)
);

let language = LRLanguage.define({
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                IfStatement: continuedIndent({ except: /^\s*(end\b|else\b|elseif\b)/ }),
                TryStatement: continuedIndent({ except: /^\s*(end\b|else\b|finally\b)/ }),
                "Definition CompoundStatement": continuedIndent({ except: /^\s*(end\b)/ }), // node groups

                ExportStatement: continuedIndent(),
                ImportStatement: continuedIndent(),
                ReturnStatement: continuedIndent(),

                Assignment: continuedIndent(),
                BinaryExpression: continuedIndent(),
                TernaryExpression: continuedIndent(),
            }),
        ],
    }),
    languageData: {
        commentTokens: { line: "#" },
        indentOnInput: /^\s*(\]|\}|\)|end|else|elseif|catch|finally)$/,
        closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    },
});

export const keywordCompletion = language.data.of({
    autocomplete: autocomplete.completeFromList(
        syntaxConfig.keywords.map((keyword) => ({
            label: keyword.name,
            type: "keyword",
        }))
    ),
});

export type JuliaLanguageConfig = {
    /** Enable keyword completion */
    enableKeywordCompletion?: boolean;
};

let defaultConfig: JuliaLanguageConfig = {
    enableKeywordCompletion: false,
};

export function julia(config: JuliaLanguageConfig = defaultConfig) {
    config = { ...defaultConfig, ...config };
    let extensions: Extension[] = [];
    if (config.enableKeywordCompletion) {
        extensions.push(keywordCompletion);
    }
    return new LanguageSupport(language, extensions);
}
