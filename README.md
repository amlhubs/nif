# @amlhubs/nif — NIF 2.0 as a Typed Metamodel

## Identity

| Field | Value |
|---|---|
| Standard | NLP Interchange Format (NIF) 2.0 |
| Specification | [NIF 2.0 Core](https://persistence.uni-leipzig.org/nlp2rdf/specification/core.html) |
| Ontology | [nif-core OWL](https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html) |
| Namespace IRI | `http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#` |
| Authority | [W3C Best Practices for Multilingual Linked Open Data Community Group (BP-MLOD CG)](https://www.w3.org/community/bpmlod/) — academic hosting at [AKSW/InfAI, Universität Leipzig](https://persistence.uni-leipzig.org/nlp2rdf/) |
| Edition | NIF 2.0 (frozen). NIF 2.1 RC is in extended draft at [nif.readthedocs.io](https://nif.readthedocs.io); 2.0 is the stable freeze. |
| npm Package | `@amlhubs/nif` |
| npm Version | `0.0.1` |
| Peer Dependencies | `@amlhubs/uml`, `@amlhubs/mof`, `@amlhubs/ontolex` |
| License | UNLICENSED |

## Authority Caveat

NIF 2.0 was developed inside the W3C BP-MLOD Community Group but **never advanced to a chartered W3C Working Group nor reached W3C Recommendation status**. The live specification is hosted at `persistence.uni-leipzig.org`, an academic URL maintained by the AKSW research group at InfAI / Universität Leipzig. A NIF 2.1 Release Candidate has been "in revision" on `nif.readthedocs.io` for several years without resolution.

This package is published per an explicit user override expanding the source-round scope despite the prior `/metamodel source` decision (`.work/2026-05-03-source/02-decisions.md` §R1) flagging the authority concerns. Consumers SHOULD weigh that governance posture against the practical interoperability the substring-offset URI scheme provides. If the Leipzig hosting lapses, every URI minted under the NIF namespace will silently break — a custom URI template under a project-controlled domain is a viable fallback.

## Abstract

The NLP Interchange Format is an RDF/OWL ontology for interchange of natural-language-processing annotations across heterogeneous tools. NIF 2.0's load-bearing contribution is a deterministic substring-offset URI scheme based on [RFC 5147](https://www.rfc-editor.org/rfc/rfc5147) (`#char=begin,end`), which lets two independent NLP pipelines refer to the same character range of the same source text without coordinating on entity identifiers in advance. Around that URI scheme NIF defines a small class hierarchy — `Context` (the full source text), `String` (any character range over a Context), and the linguistic specializations `Word`, `Phrase`, `Sentence`, `Title`, `Paragraph` — together with positional and structural properties (`beginIndex`, `endIndex`, `anchorOf`, `referenceContext`, `superString`, `subString`, `nextWord`, `previousWord`, `nextSentence`, `previousSentence`, …) and an `Annotation` class for typed third-party annotations attached to a `String`.

The `@amlhubs/nif` npm package repackages the NIF 2.0 ontology as extensible TypeScript interfaces and base classes, citing the persistence.uni-leipzig.org section anchors in JSDoc above every metaclass. Each NIF concept is grounded in the AML upstream stack: `Context` and `String` extend the OntoLex-Lemon `LexicalEntry` shape so that NIF strings interoperate with lemmatization and lexical-resource pipelines; the offset URI scheme is encoded as a typed value object so the `#char=begin,end` fragment is parseable round-trip. The package also surfaces NIF's integration point with W3C ITS 2.0 (`itsrdf:taIdentRef`, the per-span text-analytics identifier reference) so NIF annotations and ITS-driven localization metadata can travel together over the same RDF graph.

## Scope — What the Package Surfaces

The package targets the NIF 2.0 Core ontology surface, organized by section anchor on [persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html](https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html):

| NIF Class | NIF-Core Anchor | Role |
|---|---|---|
| `Context` | `nif:Context` | The full source text — the anchor for every `String` URI minted within it |
| `String` | `nif:String` | Any character range over a `Context`, identified by `#char=begin,end` |
| `Word` | `nif:Word` | Token-level `String` (tokenization output) |
| `Phrase` | `nif:Phrase` | Multi-word constituent `String` (parser output) |
| `Sentence` | `nif:Sentence` | Sentence-boundary `String` (sentence segmenter output) |
| `Title` | `nif:Title` | A `String` representing a document/section title |
| `Paragraph` | `nif:Paragraph` | A paragraph-level `String` |
| `Annotation` | `nif:Annotation` | Third-party typed annotation attached to a `String` |
| `OffsetBasedString` | `nif:OffsetBasedString` | URI-scheme realization of `String` using RFC 5147 `#char=` fragments |
| `ContextHashBasedString` | `nif:ContextHashBasedString` | URI-scheme realization of `String` using context-hash digests |

Plus the property surface:

| NIF Property | Carrier | Codomain | Purpose |
|---|---|---|---|
| `nif:beginIndex` | `String` | `xsd:nonNegativeInteger` | Inclusive start offset (UTF-16 code units per spec §URI Schemes) |
| `nif:endIndex` | `String` | `xsd:nonNegativeInteger` | Exclusive end offset |
| `nif:anchorOf` | `String` | `xsd:string` | The literal characters at `[beginIndex, endIndex)` |
| `nif:referenceContext` | `String` | `Context` | The `Context` this `String` is offset within |
| `nif:isString` | `Context` | `xsd:string` | The full text content of a `Context` |
| `nif:superString` | `String` | `String` | Containing `String` (e.g., a `Sentence` containing a `Word`) |
| `nif:subString` | `String` | `String` | Inverse of `superString` |
| `nif:nextWord` | `Word` | `Word` | Sequential next `Word` in reading order |
| `nif:previousWord` | `Word` | `Word` | Inverse of `nextWord` |
| `nif:nextSentence` | `Sentence` | `Sentence` | Sequential next `Sentence` |
| `nif:previousSentence` | `Sentence` | `Sentence` | Inverse of `nextSentence` |
| `itsrdf:taIdentRef` | `String` | IRI | Text-analytics identifier reference (W3C ITS 2.0 integration point) |

## Dependency Topology

`@amlhubs/nif` is a downstream metamodel — it consumes UML for its metaclass machinery, MOF for reflective access, and OntoLex-Lemon as the lexical-resource grounding for `Context`/`String`.

```
@amlhubs/uml         (UML 2.5.1 — root)
   ▲
   │
@amlhubs/mof         (MOF 2.5.1 — reflective ring on UML)
   ▲
   │
@amlhubs/ontolex     (W3C OntoLex-Lemon — lexical-entry vocabulary)
   ▲
   │  peerDependencies (uml + mof + ontolex)
   │
@amlhubs/nif         (THIS PACKAGE — NIF 2.0 substring-offset URI scheme + nif-core hierarchy)
```

## Installation & Usage

```bash
npm install @amlhubs/nif @amlhubs/ontolex @amlhubs/mof @amlhubs/uml
```

```typescript
import type {
  IContext,
  IString,
  IWord,
  IAnnotation,
} from '@amlhubs/nif';

const ctx: IContext = {
  elementId: 'doc-1',
  isString: 'The quick brown fox jumps over the lazy dog.',
  beginIndex: 0,
  endIndex: 44,
};

const word: IWord = {
  elementId: 'doc-1#char=4,9',
  beginIndex: 4,
  endIndex: 9,
  anchorOf: 'quick',
  referenceContextId: ctx.elementId,
};
```

## Provenance & Formal References

- [NIF 2.0 Core Specification](https://persistence.uni-leipzig.org/nlp2rdf/specification/core.html) — the persistence-URL freeze of NIF 2.0
- [nif-core ontology (HTML view)](https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html)
- [nif-core ontology (OWL/RDF source)](https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.owl)
- [W3C Best Practices for Multilingual Linked Open Data CG (host community group)](https://www.w3.org/community/bpmlod/)
- [AKSW / InfAI — Universität Leipzig (technical maintainer)](https://aksw.org/)
- [NIF 2.1 RC (extended draft, non-normative)](https://nif.readthedocs.io/)
- [RFC 5147 — URI Fragment Identifiers for the text/plain Media Type](https://www.rfc-editor.org/rfc/rfc5147) — the source of the `#char=begin,end` substring-offset scheme
- [W3C ITS 2.0 — itsrdf:taIdentRef integration point](https://www.w3.org/TR/its20/#textanalysis)

## Version History

| Version | Date | Change Summary |
|---|---|---|
| 0.0.1 | initial publish | NIF 2.0 Core surface — Context, String, Word, Phrase, Sentence, Title, Paragraph, Annotation, OffsetBasedString, ContextHashBasedString + offset/anchor/superString/subString/nextWord/previousWord/nextSentence/previousSentence/itsrdf:taIdentRef property surface |

## License

UNLICENSED — restricted npm access under `@amlhubs` scope at [npm.pkg.github.com](https://npm.pkg.github.com).
