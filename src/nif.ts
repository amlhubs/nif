// ═══════════════════════════════════════════════════════════════════════════
// nif.ts
// NIF 2.0 — NLP Interchange Format
// Specification: https://persistence.uni-leipzig.org/nlp2rdf/specification/core.html
// Ontology:      https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html
// Namespace IRI: http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#
//
// Authority caveat: NIF 2.0 was developed inside the W3C Best Practices for
//   Multilingual Linked Open Data Community Group (BP-MLOD CG) and never
//   advanced to a chartered W3C Working Group nor reached W3C Recommendation
//   status. The live spec is hosted at persistence.uni-leipzig.org, an
//   academic URL maintained by AKSW / InfAI at Universität Leipzig. A NIF 2.1
//   Release Candidate has been "in revision" on nif.readthedocs.io for years
//   without resolution. NIF 2.0 (2014-frozen) remains the stable reference.
//   This package is published per an explicit user override expanding the
//   `/metamodel source` round scope despite the prior decision log
//   (.work/2026-05-03-source/02-decisions.md §R1) flagging the authority
//   concerns. See README §"Authority Caveat".
//
// Scope: ISO-style TypeScript surface for the NIF 2.0 nif-core ontology. Covers:
//   - Core class hierarchy: Context, String, Word, Phrase, Sentence, Title,
//     Paragraph, Annotation
//   - URI scheme realizations: OffsetBasedString (RFC 5147 #char=begin,end),
//     ContextHashBasedString (context-hash digest scheme)
//   - Positional & structural property surface: beginIndex, endIndex,
//     anchorOf, isString, referenceContext, superString/subString,
//     nextWord/previousWord, nextSentence/previousSentence
//   - W3C ITS 2.0 integration: itsrdf:taIdentRef
//
// Generation chain:
//   @amlhubs/uml      (UML 2.5.1)            ─upstream─►
//   @amlhubs/mof      (MOF 2.5.1)            ─upstream─►
//   @amlhubs/ontolex  (W3C OntoLex-Lemon)    ─upstream─►
//   @amlhubs/nif      (THIS FILE) ─consumes upstreams via `import type` only
//
// Architectural ordering:
//   NIF is downstream of UML, MOF, and OntoLex. Interfaces here extend
//   `IElement` from UML where the NIF concept is a UML Element by spec
//   grounding (Context, String, Annotation are all NamedElement-rooted in the
//   nif-core ontology). Where the NIF concept aligns with an OntoLex lexical
//   surface (Context as a documented text resource, String as a textual span
//   with a written representation), the JSDoc cites the OntoLex anchor and
//   carries an optional pointer; structural extension is avoided so NIF stays
//   re-publishable independent of OntoLex evolution.
//
// Pattern conformance:
//   - Header banners + `// --- N. IFoo (§{anchor}) ---` markers per metaclass.
//   - JSDoc with @standard, @section, @metaclass, @generalization, @definition.
//   - Generic Type Parameters bound by `extends` per /.claude/rules/convention/
//     interfaces.md — every type parameter declares a constraint.
//   - Concrete classes appear after all interfaces in form
//     `export (abstract) class {Concept} extends {Parent} implements I{Concept}`.
//   - No `enum` declarations, no bare string-union types for closed sets.
//     URI-scheme kinds modeled as a const-object whose derived type is wrapped
//     in a branded interface.
//   - `noImplicitOverride: true`: every member that overrides an abstract
//     parent member carries the `override` modifier.
//
// IMPLEMENTERS: INSERT new metaclass declarations BELOW this banner, between
//   the upstream-import block and the closing comment. NEVER rewrite this
//   header. NEVER overwrite previously-inserted declarations.
// ═══════════════════════════════════════════════════════════════════════════

// UML 2.5.1 metaclasses — used to root NIF NamedElements per nif-core grounding.
// IElement: every NIF concept that owns members is an Element (ownership of
//   anchorOf strings, sub-string sequences, annotation descriptors).
// IPackage: type-only reference for documentation cross-link to the UML
//   Package metaclass that may realize a NIF Context as a documented textual
//   resource at the serialization layer.
import type {
  IElement,
  IPackage as _UmlIPackage,
} from '@amlhubs/uml';
export type UmlPackageRealizationOfContext = _UmlIPackage;

// MOF 2.5.1 metaclasses — used where NIF specifies reflective access for
//   round-trip MOF/XMI interchange.
import type { IMofObject } from '@amlhubs/mof';
export type { IMofObject };

// OntoLex-Lemon — used as documented upstream for NIF Context and String.
//   These imports are type-only. NIF concepts do NOT structurally extend
//   OntoLex interfaces; they cite the OntoLex shape via JSDoc and carry
//   optional pointer fields where round-trip integration is required.
import type { ILexicalEntry as _OntolexILexicalEntry } from '@amlhubs/ontolex';
export type OntolexLexicalEntryAlignmentOfString = _OntolexILexicalEntry;

// ─── IMPLEMENTER INSERTION POINT — BEGIN ─────────────────────────────────
//
// Implementers: place every metaclass declaration BELOW this marker in
// strict spec-order following the §{anchor} numbering of nif-core.html:
//
//   1. URI-scheme value-objects   (#char=begin,end parser, context-hash)
//   2. Foundation interfaces     (IString, IContext) + concrete classes
//   3. URI-scheme realizations    (IOffsetBasedString, IContextHashBasedString)
//   4. Linguistic specializations (IWord, IPhrase, ISentence, ITitle, IParagraph)
//   5. Annotation surface         (IAnnotation, itsrdf:taIdentRef integration)
//   6. Property accessors         (positional, anchorOf, superString family,
//                                  nextWord/previousWord family,
//                                  nextSentence/previousSentence family)
//
// Insertion discipline:
//   - One marker per metaclass: `// --- N. IFoo (§{anchor}) ---`
//   - JSDoc above every interface and every concrete class:
//       @standard NIF 2.0 (W3C BP-MLOD CG)
//       @section  https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#{anchor}
//       @metaclass {nif:ClassName}
//       @generalization {parent class IRI(s)}
//       @definition <verbatim from nif-core spec>
//       @associationEnds / @ownedAttributes / @operations / @constraints (as applicable)
//   - Every Three-Layer Pattern declaration: IFoo (Layer 1) → AbstractFoo
//     (Layer 2, `const` on every type parameter) → Foo (Layer 3, zero type
//     parameters) where the metaclass admits parameterization. Where the
//     spec metaclass is an inert leaf (no parametricity), the simpler
//     `IFoo` + concrete `Foo` pattern of /uml/sbvr/ocl is acceptable.
//
// ─── IMPLEMENTER INSERTION POINT — END ───────────────────────────────────
