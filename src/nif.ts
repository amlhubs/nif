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
//   @amlhubs/nif      (THIS FILE) ─consumes upstreams via `import type` only
//   @amlhubs/ontolex  (W3C OntoLex-Lemon)    ─forward citation via JSDoc only
//                       (peer published independently; nif.ts holds an
//                        ontolexLexicalEntryId : string pointer slot for
//                        round-trip alignment without a build-time dependency)
//
// Architectural ordering:
//   NIF is downstream of UML and MOF. Interfaces here extend `IElement` from
//   UML where the NIF concept is a UML Element by spec grounding (Context,
//   String, Annotation are all NamedElement-rooted in the nif-core ontology).
//   Where the NIF concept aligns with an OntoLex lexical surface (Context as
//   a documented text resource, String as a textual span with a written
//   representation), the JSDoc cites the OntoLex anchor and the concrete
//   class carries an optional pointer field. Structural extension of an
//   OntoLex interface is avoided so NIF stays re-publishable independent of
//   OntoLex evolution and so the @amlhubs/ontolex package can be consumed
//   only by call-sites that need it.
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
//     in a branded interface (per `UriSchemeKindRegistry`).
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
//   round-trip MOF/XMI interchange (NIF graphs are exchanged as RDF, but
//   downstream tools may pun NIF resources to MOF objects when integrating
//   nif-annotated text into a UML-driven model store).
import type { IMofObject } from '@amlhubs/mof';
export type { IMofObject };

// ═══════════════════════════════════════════════════════════════════════════
// NIF 2.0 NAMESPACE & URI-SCHEME TYPE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @standard NIF 2.0 (W3C BP-MLOD CG) — namespace IRI freeze
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#header
 * The canonical NIF 2.0 namespace IRI. Every NIF class and property in the
 * nif-core ontology is identified by an IRI of the form
 * `${NIF_CORE_NAMESPACE_IRI}${LocalName}`. Round-trip serializers and
 * SPARQL constructors should reference this constant rather than embedding
 * the literal.
 */
export const NIF_CORE_NAMESPACE_IRI =
  'http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#' as const;

/**
 * @standard W3C ITS 2.0 — companion namespace
 * @section https://www.w3.org/TR/its20/#textanalysis
 * The W3C ITS 2.0 RDF namespace IRI (the `itsrdf:` prefix). NIF 2.0 normatively
 * integrates `itsrdf:taIdentRef` for per-span text-analytics identifier
 * references; this constant lets downstream serializers compose ITS-aware NIF
 * graphs without re-declaring the namespace.
 */
export const ITS_RDF_NAMESPACE_IRI =
  'http://www.w3.org/2005/11/its/rdf#' as const;

/**
 * @standard NIF 2.0 §"URI Schemes"
 * @section https://persistence.uni-leipzig.org/nlp2rdf/specification/core.html#uri-schemes
 * Closed-set registry of NIF URI scheme kinds. Each scheme is a subclass of
 * `nif:URIScheme` and constrains the syntax of the URIs that mint instances
 * of `nif:String` over a given `nif:Context`. The full registry is reified as
 * a const-object whose derived type is wrapped in a branded interface — this
 * avoids both raw string-union types and `enum` declarations per
 * /.claude/rules/convention/interfaces.md.
 *
 * - `OffsetBased`: nif:OffsetBasedString — char-offset over a Context, the
 *   recommended scheme since NIF 2.0; cf. Hellmann et al. EKAW 2012.
 * - `RFC5147`: nif:RFC5147String — DEPRECATED; the spec marks this scheme
 *   `owl:deprecated true` because RFC 5147 character positions diverge from
 *   Unicode character counts when the source text contains `\r\n` newlines.
 * - `ContextHashBased`: nif:ContextHashBasedString — context-hash digest
 *   scheme for stand-off referencing without char positions.
 * - `CStringInst`: nif:CStringInst — an arbitrary URI (e.g., URN) for an
 *   arbitrary string of the context (Stanbol-style TextAnnotation alias).
 */
export const UriSchemeKindRegistry = {
  OffsetBased: 'OffsetBasedString',
  RFC5147: 'RFC5147String',
  ContextHashBased: 'ContextHashBasedString',
  CStringInst: 'CStringInst',
} as const;

/**
 * @standard NIF 2.0 §"URI Schemes"
 * @section https://persistence.uni-leipzig.org/nlp2rdf/specification/core.html#uri-schemes
 * Branded carrier for `UriSchemeKindRegistry` values. The brand prevents
 * collision with arbitrary strings while preserving the literal-set guarantee
 * the registry encodes. Per /.claude/rules/convention/interfaces.md no bare
 * string-union types are admitted.
 */
export interface IUriSchemeKind<
    Token extends typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry] =
        typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry]> {
  readonly token: Token;
  readonly brand: 'nif.UriSchemeKind';
}

/**
 * @standard NIF 2.0 §"URI Schemes" (RFC 5147 substring fragment)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/specification/core.html#uri-schemes
 * @reference https://www.rfc-editor.org/rfc/rfc5147 — URI Fragment Identifiers
 *   for the text/plain Media Type
 *
 * Parsed value object representing the NIF substring-offset fragment
 * `#char=begin,end`. Both indices are non-negative integers measured in
 * Unicode code units (per the spec's "Indices are to be counted in code
 * units as is common in most programming language and SPARQL engines"
 * statement, citing SPARQL 1.1 §17.4.3.2 STRLEN / §17.4.3.3 SUBSTR).
 *
 * @ownedAttributes
 *   beginIndex : Integer [1] -- inclusive start, in code units, ≥ 0
 *   endIndex   : Integer [1] -- exclusive end,   in code units, ≥ beginIndex
 *
 * @constraints
 *   [non_negative_indices]: beginIndex >= 0 and endIndex >= 0
 *     -- spec §URI Schemes: "MUST not have negative values" (Requirement 1).
 *   [end_after_begin]: endIndex >= beginIndex
 *     -- structurally implied by RFC 5147: a character range is consecutive.
 */
export interface ICharOffsetFragment {
  readonly beginIndex: number;
  readonly endIndex: number;
  readonly brand: 'nif.CharOffsetFragment';
}

/**
 * Constructor / parser pair for `ICharOffsetFragment`. Round-trip stable
 * against the literal `#char=begin,end` fragment syntax of RFC 5147 §2.2.
 */
export const CharOffsetFragment = {
  /**
   * Mints an `ICharOffsetFragment` from two non-negative integers.
   * Throws if either bound is negative or if `endIndex < beginIndex`.
   */
  of(beginIndex: number, endIndex: number): ICharOffsetFragment {
    if (!Number.isInteger(beginIndex) || beginIndex < 0) {
      throw new Error(
        `nif.CharOffsetFragment: beginIndex must be a non-negative integer, got ${beginIndex} (NIF 2.0 §URI Schemes Requirement 1)`,
      );
    }
    if (!Number.isInteger(endIndex) || endIndex < 0) {
      throw new Error(
        `nif.CharOffsetFragment: endIndex must be a non-negative integer, got ${endIndex} (NIF 2.0 §URI Schemes Requirement 1)`,
      );
    }
    if (endIndex < beginIndex) {
      throw new Error(
        `nif.CharOffsetFragment: endIndex (${endIndex}) must be >= beginIndex (${beginIndex}) (RFC 5147 §2.2.2 character range)`,
      );
    }
    return Object.freeze({
      beginIndex,
      endIndex,
      brand: 'nif.CharOffsetFragment' as const,
    });
  },

  /**
   * Parses the literal `#char=begin,end` fragment from an RFC 5147 URI tail.
   * Accepts both `char=…` and `#char=…` forms. Returns `undefined` if the
   * fragment is malformed; throws on out-of-range integer values that pass
   * the regex but fail the constructor's invariants.
   *
   * Examples (from spec §URI Schemes):
   *   "#char=0,26610"  →  { beginIndex: 0, endIndex: 26610 }
   *   "char=4,9"       →  { beginIndex: 4, endIndex: 9 }
   */
  parse(fragment: string): ICharOffsetFragment | undefined {
    const match = /^#?char=(\d+),(\d+)$/.exec(fragment);
    if (match === null) {
      return undefined;
    }
    const begin = Number.parseInt(match[1] as string, 10);
    const end = Number.parseInt(match[2] as string, 10);
    return CharOffsetFragment.of(begin, end);
  },

  /**
   * Renders an `ICharOffsetFragment` back into the canonical
   * `#char=begin,end` literal. Round-trip stable against `parse`.
   */
  format(fragment: ICharOffsetFragment): string {
    return `#char=${fragment.beginIndex},${fragment.endIndex}`;
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// NIF 2.0 BASE CLASSES (nif-core "Base Classes and Properties" section)
// ═══════════════════════════════════════════════════════════════════════════

// --- 1. INifString (nif:String) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e436
 * @metaclass abstract (per spec rdfs:comment "This class is abstract and
 *   should not be serialized")
 * @generalization IElement (UML §7.8.6)
 * @definition Individuals of this class are a string, i.e. Unicode characters,
 *   who have been given a URI and are used in the subject of an RDF statement.
 *   This class is abstract and should not be serialized.
 *
 * @ownedAttributes
 *   anchorOf : String [0..1] (nif:anchorOf, xsd:string) -- the literal characters
 *     at [beginIndex, endIndex) — the string the URI represents as an RDF Literal.
 *   beginIndex : Integer [0..1] (nif:beginIndex, xsd:nonNegativeInteger,
 *     functional, subPropertyOf oa:start) -- inclusive start offset measured in
 *     Unicode code units; mandatory whenever this nif:String is also a
 *     nif:CString or any URI-scheme realization that requires it.
 *   endIndex : Integer [0..1] (nif:endIndex, xsd:nonNegativeInteger, functional,
 *     subPropertyOf oa:end) -- exclusive end offset measured in Unicode code
 *     units; mandatory under the same conditions as beginIndex.
 *
 * @associationEnds
 *   referenceContext : Context [1] (nif:referenceContext, ObjectProperty,
 *     functional) -- every nif:String that is not itself a nif:Context MUST
 *     have exactly one reference context (spec §referenceContext).
 *   superString : String [*] (nif:superString, ObjectProperty,
 *     subPropertyOf nif:superStringTrans) -- containing nif:String (e.g., a
 *     nif:Sentence containing a nif:Word).
 *   subString   : String [*] (nif:subString,   ObjectProperty,
 *     inverseOf nif:superString, subPropertyOf nif:subStringTrans) -- contained
 *     nif:String.
 *
 * @constraints
 *   [non_context_must_have_reference_context]:
 *     not self.oclIsKindOf(IContext) implies referenceContextId <> null
 *     -- spec §referenceContext: "Each String that is not an instance of
 *     nif:Context MUST have exactly one reference context".
 *   [reference_context_functional]:
 *     -- spec §referenceContext: "This property is functional".
 *   [has_key]: { referenceContext, beginIndex, endIndex }
 *     -- spec owl:hasKey assertion: a nif:String individual is uniquely
 *     determined by its referenceContext and (beginIndex, endIndex) tuple.
 */
export interface INifString<
    ReferenceContext extends INifContext = INifContext,
    Super extends IElement = IElement,
    Sub extends IElement = IElement>
    extends IElement {
  readonly anchorOf: string | undefined;
  readonly beginIndex: number | undefined;
  readonly endIndex: number | undefined;
  readonly referenceContextId: string | undefined;     // memberEnd → IContext
  readonly superStringIds: ReadonlyArray<string>;      // memberEnd → INifString
  readonly subStringIds: ReadonlyArray<string>;        // memberEnd → INifString
  referenceContext(): ReferenceContext | undefined;
  superStrings(): ReadonlyArray<Super>;
  subStrings(): ReadonlyArray<Sub>;
}

// --- 2. INifContext (nif:Context) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e468
 * @metaclass concrete
 * @generalization INifString
 * @definition The string that serves as a context for its substrings. The
 *   Unicode String given in the nif:isString or the content obtained by
 *   dereferencing nif:contextStringRef property must be used to calculate the
 *   begin and endIndex for all nif:Strings that have a nif:referenceContext
 *   property to this URI.
 *
 * @ownedAttributes
 *   isString : String [0..1] (nif:isString, xsd:string, functional,
 *     subPropertyOf nif:anchorOf) -- the reference text as rdf:Literal for this
 *     nif:Context resource. NIF requires that the reference text is always
 *     included in the RDF as an rdf:Literal unless contextStringRef is used.
 *
 * @associationEnds
 *   contextStringRef : Resource [0..1] (nif:contextStringRef, ObjectProperty,
 *     functional) -- external reference to a location where the text for the
 *     Context can be retrieved when it cannot be embedded via isString
 *     directly (license restrictions / size). Mutually exclusive with isString
 *     per the spec's owl:unionOf restriction (exactly one of the two).
 *   sourceUrl : Resource [0..1] (nif:sourceUrl, ObjectProperty,
 *     subPropertyOf prov:hadPrimarySource) -- the URL the context was
 *     extracted from (HTML, XML, plain text — the primary source).
 *   broaderContext  : Context [*] (nif:broaderContext)  -- containing context.
 *   narrowerContext : Context [*] (nif:narrowerContext) -- contained context.
 *   predLang : Language [0..1] (nif:predLang, ObjectProperty,
 *     range lvont:Language) -- predominant language of the text.
 *
 * @constraints
 *   [reference_context_self]:
 *     -- spec §Context: "Instances of nif:Context do have itself as
 *     reference context" (owl:hasSelf restriction on nif:referenceContext).
 *   [exactly_one_of_isstring_or_contextstringref]:
 *     (isString <> null) xor (contextStringRefId <> null)
 *     -- spec §Context owl:unionOf restriction: a Context carries the text
 *     either inline via isString OR externally via contextStringRef, exactly
 *     one of the two must be present (cardinality 1).
 */
export interface INifContext<
    Super extends IElement = IElement,
    Narrower extends IElement = IElement>
    extends INifString {
  readonly isString: string | undefined;
  readonly contextStringRefId: string | undefined;       // memberEnd → IRI of external resource
  readonly sourceUrlId: string | undefined;              // memberEnd → IRI of primary source
  readonly broaderContextIds: ReadonlyArray<string>;     // memberEnd → INifContext
  readonly narrowerContextIds: ReadonlyArray<string>;    // memberEnd → INifContext
  readonly predominantLanguageId: string | undefined;    // memberEnd → lvont:Language IRI
  broaderContexts(): ReadonlyArray<Super>;
  narrowerContexts(): ReadonlyArray<Narrower>;
}

// ═══════════════════════════════════════════════════════════════════════════
// NIF 2.0 URI SCHEME REALIZATIONS (nif-core "concrete URI Schemes" section)
// ═══════════════════════════════════════════════════════════════════════════

// --- 3. INifUriScheme (nif:URIScheme) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1037
 * @metaclass abstract (per spec "This is an abstract class and should not be
 *   serialized")
 * @generalization INifString
 * @definition A URI Scheme for NIF; subclasses define guidelines on the URI
 *   Scheme as well as the text it refers to. This class is just to keep some
 *   order, and should not be serialized. Users of NIF can create their own URI
 *   schemes by subclassing nif:String and providing documentation on the Web
 *   in the rdfs:comment field.
 *
 * @associationEnds
 *   schemeKind : UriSchemeKind [1] -- the closed-set discriminator over
 *     {OffsetBased, RFC5147, ContextHashBased, CStringInst} per
 *     UriSchemeKindRegistry above.
 */
export interface INifUriScheme<
    Kind extends typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry] =
        typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry]>
    extends INifString {
  readonly schemeKind: IUriSchemeKind<Kind>;
}

// --- 4. INifCString (nif:CString) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1075
 * @metaclass abstract (per spec "This is an abstract class and should not be
 *   serialized")
 * @generalization INifUriScheme
 * @definition A URI Scheme for NIF which is able to refer to a single,
 *   consecutive string in a context. Note that any scheme subclassing this
 *   class requires the existence of beginIndex, endIndex and referenceContext.
 *
 * @constraints
 *   [begin_index_cardinality_one]:
 *     -- spec §CString owl:cardinality 1 restriction on nif:beginIndex.
 *   [end_index_cardinality_one]:
 *     -- spec §CString owl:cardinality 1 restriction on nif:endIndex.
 *   [reference_context_required]: referenceContextId <> null
 *     -- inherited spec §CString requirement: "requires the existence of
 *     beginIndex, endIndex and referenceContext".
 */
export interface INifCString<
    Kind extends typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry] =
        typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry]>
    extends INifUriScheme<Kind> {
  readonly beginIndex: number;            // narrowed to mandatory at this layer
  readonly endIndex: number;              // narrowed to mandatory at this layer
  readonly referenceContextId: string;    // narrowed to mandatory at this layer
}

// --- 5. IOffsetBasedString (nif:OffsetBasedString) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1131
 * @metaclass concrete
 * @generalization INifCString
 * @definition Offset-based String. cf. Linked-Data Aware URI Schemes for
 *   Referencing Text Fragments by Sebastian Hellmann, Jens Lehmann und Sören
 *   Auer in EKAW 2012 http://jens-lehmann.org/files/2012/ekaw_nif.pdf —
 *   requires the existence of begin, endIndex and referenceContext. The
 *   recommended NIF 2.0 URI scheme: identifies a String span by a
 *   `#char=begin,end` fragment over a Context whose text is given by
 *   `nif:isString`.
 *
 * @associationEnds
 *   offsetFragment : ICharOffsetFragment [1] -- the parsed `#char=begin,end`
 *     fragment of the String's URI, kept structurally accessible so call-sites
 *     can compose URIs without re-parsing.
 *   correspondsToOaTextPositionSelector : oa:TextPositionSelector [0..1]
 *     -- spec §OffsetBasedString rdfs:subClassOf oa:TextPositionSelector
 *     (Web Annotation Data Model). Optional pointer for round-trip with the
 *     OA framework; not required for pure NIF graphs.
 *
 * @constraints
 *   [scheme_kind_offset_based]: schemeKind.token = 'OffsetBasedString'
 *   [offset_fragment_matches_indices]:
 *     offsetFragment.beginIndex = beginIndex and
 *     offsetFragment.endIndex   = endIndex
 *     -- the parsed fragment must agree with the carrier indices.
 */
export interface IOffsetBasedString
    extends INifCString<typeof UriSchemeKindRegistry.OffsetBased> {
  readonly offsetFragment: ICharOffsetFragment;
  readonly oaTextPositionSelectorId: string | undefined;
}

// --- 6. IContextHashBasedString (nif:ContextHashBasedString) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1108
 * @metaclass concrete
 * @generalization INifUriScheme   (NOT INifCString — the spec places
 *   ContextHashBasedString directly under URIScheme, not under CString,
 *   because hash-based identifiers do not require begin/endIndex on the
 *   String itself; offsets are encoded inside the hash payload.)
 * @definition Context Hash Based String. cf. "Linked-Data Aware URI Schemes
 *   for Referencing Text" — identifies a String span by a hash digest computed
 *   over the Context content plus a positional payload, so the URI is stable
 *   under non-positional Context modifications.
 *
 * @ownedAttributes
 *   hashFragment : String [1] -- the textual hash payload following the
 *     `#hash_…` fragment in the canonical URI scheme.
 *
 * @constraints
 *   [scheme_kind_context_hash_based]:
 *     schemeKind.token = 'ContextHashBasedString'
 */
export interface IContextHashBasedString
    extends INifUriScheme<typeof UriSchemeKindRegistry.ContextHashBased> {
  readonly hashFragment: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NIF 2.0 STRUCTURE LAYER (nif-core "Structure" section)
// ═══════════════════════════════════════════════════════════════════════════

// --- 7. INifStructure (nif:Structure) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1196
 * @metaclass abstract (per spec "This is an abstract class and should not be
 *   serialized")
 * @generalization INifString
 * @definition A structure is a more or less arbitrary label for a partitioning
 *   of a string. We do not follow a strict approach for what a word, phrase,
 *   sentence, title, paragraph is. These labels enable the definition processes
 *   for tool chains, e.g. tool analyses nif:Paragraph and calculates term
 *   frequency.
 *
 * @associationEnds
 *   sentence : Sentence [0..1] (nif:sentence, ObjectProperty,
 *     domain Structure, range Sentence) -- links words and other structures
 *     to their containing sentence.
 */
export interface INifStructure<
    ParentSentence extends ISentence = ISentence>
    extends INifString {
  readonly sentenceId: string | undefined;       // memberEnd → ISentence
  sentence(): ParentSentence | undefined;
}

// --- 8. IWord (nif:Word) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1218
 * @metaclass concrete
 * @generalization INifStructure
 * @definition The Word class represents strings that are tokens or words. A
 *   string is a Word, if it is a word. We don't nitpick about whether it is a
 *   pronoun, a name, a punctuation mark or an apostrophe or whether it is
 *   separated by white space from another Word or something else. The string
 *   'He enters the room.' for example has 5 words. Words are assigned by a
 *   tokenizer NIF Implementation. Single word phrases might be tagged as
 *   nif:Word and nif:Phrase.
 *
 *   The class has not been named 'Token' as the NLP definition of 'token' is
 *   descriptive (and not well-defined), while the assignment of what is a Word
 *   and what not is prescriptive.
 *
 * @associationEnds
 *   nextWord     : Word [0..1] (nif:nextWord,     ObjectProperty, functional,
 *     inverseOf nif:previousWord, subPropertyOf nif:nextWordTrans) -- the
 *     sequential next Word in reading order. May not assume string adjacency
 *     (gaps and whitespace between words may exist).
 *   previousWord : Word [0..1] (nif:previousWord, ObjectProperty, functional,
 *     subPropertyOf nif:previousWordTrans) -- inverse of nextWord.
 *
 * @constraints
 *   [next_word_functional]:
 *     -- spec §nextWord owl:FunctionalProperty.
 *   [previous_word_functional]:
 *     -- spec §previousWord owl:FunctionalProperty.
 *   [next_previous_inverse]:
 *     other in self.nextWord implies self in other.previousWord
 *     -- spec §nextWord owl:inverseOf nif:previousWord.
 */
export interface IWord<
    Next extends IElement = IElement,
    Previous extends IElement = IElement>
    extends INifStructure {
  readonly nextWordId: string | undefined;       // memberEnd [0..1] → IWord
  readonly previousWordId: string | undefined;   // memberEnd [0..1] → IWord
  nextWord(): Next | undefined;
  previousWord(): Previous | undefined;
}

// --- 9. IPhrase (nif:Phrase) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1268
 * @metaclass concrete
 * @generalization INifStructure
 * @definition A nif:Phrase can be a nif:String, that is a chunk of several
 *   words or a word itself (e.g. a NounPhrase as a Named Entity). The term is
 *   underspecified and can be compatible with many definitions of phrase.
 *   Please subClass it to specify the meaning (e.g. for Chunking or Phrase
 *   Structure Grammar). Example: ((My dog)(also)(likes)(eating (sausage)))
 */
export interface IPhrase extends INifStructure {}

// --- 10. ISentence (nif:Sentence) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1276
 * @metaclass concrete
 * @generalization INifStructure
 * @definition A sentence.
 *
 * @associationEnds
 *   word         : Word [*]    (nif:word,         ObjectProperty,
 *     domain Sentence, range Word) -- this property links sentences to their
 *     words.
 *   firstWord    : Word [0..1] (nif:firstWord,    ObjectProperty, functional,
 *     subPropertyOf nif:word) -- this property links sentences to their first
 *     word.
 *   lastWord     : Word [0..1] (nif:lastWord,     ObjectProperty, functional,
 *     subPropertyOf nif:word) -- this property links sentences to their last
 *     word.
 *   nextSentence : Sentence [0..1] (nif:nextSentence, ObjectProperty,
 *     functional, inverseOf nif:previousSentence,
 *     subPropertyOf nif:nextSentenceTrans) -- the sequential next Sentence;
 *     no assumption of string adjacency.
 *   previousSentence : Sentence [0..1] (nif:previousSentence, ObjectProperty,
 *     functional, subPropertyOf nif:previousSentenceTrans) -- inverse of
 *     nextSentence.
 *
 * @constraints
 *   [next_sentence_functional]:
 *     -- spec §nextSentence owl:FunctionalProperty.
 *   [previous_sentence_functional]:
 *     -- spec §previousSentence owl:FunctionalProperty.
 *   [first_word_functional]:
 *     -- spec §firstWord owl:FunctionalProperty.
 *   [last_word_functional]:
 *     -- spec §lastWord owl:FunctionalProperty.
 */
export interface ISentence<
    Next extends IElement = IElement,
    Previous extends IElement = IElement,
    WordT extends IWord = IWord>
    extends INifStructure {
  readonly wordIds: ReadonlyArray<string>;             // memberEnd [*] → IWord
  readonly firstWordId: string | undefined;            // memberEnd [0..1] → IWord
  readonly lastWordId: string | undefined;             // memberEnd [0..1] → IWord
  readonly nextSentenceId: string | undefined;         // memberEnd [0..1] → ISentence
  readonly previousSentenceId: string | undefined;     // memberEnd [0..1] → ISentence
  words(): ReadonlyArray<WordT>;
  firstWord(): WordT | undefined;
  lastWord(): WordT | undefined;
  nextSentence(): Next | undefined;
  previousSentence(): Previous | undefined;
}

// --- 11. ITitle (nif:Title) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1320
 * @metaclass concrete
 * @generalization INifStructure
 * @definition A title within a text.
 */
export interface ITitle extends INifStructure {}

// --- 12. IParagraph (nif:Paragraph) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e1313
 * @metaclass concrete
 * @generalization INifStructure
 * @definition A paragraph.
 */
export interface IParagraph extends INifStructure {}

// ═══════════════════════════════════════════════════════════════════════════
// NIF 2.0 ANNOTATION VOCABULARY (nif-core "Abstract Annotation Vocab" section)
// ═══════════════════════════════════════════════════════════════════════════

// --- 13. INifAnnotation (nif:Annotation) ---
/**
 * @standard NIF 2.0 (W3C BP-MLOD CG)
 * @section https://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core/nif-core.html#d4e756
 * @metaclass concrete (root of the annotation hierarchy)
 * @generalization IElement (UML §7.8.6)
 * @definition NIF String that also either carries annotation property
 *   assertions (see nif:PropertyBasedAnnotation) or marks implicitly of a
 *   text spans themselves (see nif:TextSpanAnnotation).
 *
 * @associationEnds
 *   annotationUnit  : AnnotationUnit [0..1] (nif:annotationUnit, ObjectProperty)
 *     -- groups unambiguously a set of annotation assertions for the same
 *     kind of annotation information (e.g. several itsrdf:taIdentRef
 *     assertions) so their provenance / confidence can be unambiguously
 *     attached.
 *   provenance      : prov:Activity | prov:Agent [0..1] (nif:provenance,
 *     ObjectProperty) -- provenance of an annotation, specified either as a
 *     complete activity description (preferred) or just the agent that
 *     created the annotation.
 *   itsrdfTaIdentRef : Resource [0..1] (itsrdf:taIdentRef) -- W3C ITS 2.0
 *     §"Text Analysis" integration point: a per-span text-analytics identifier
 *     reference. NIF declares companion properties (nif:taIdentConf,
 *     nif:taIdentProv) for confidence and provenance of this link via the
 *     §"Declaration of Corresponding Companion Properties" section of
 *     nif-core.ttl: `itsrdf:taIdentRef nif:confidenceProperty nif:taIdentConf ;
 *     nif:provenanceProperty nif:taIdentProv .`
 *   itsrdfTaIdentConf : Decimal [0..1] (nif:taIdentConf, DatatypeProperty,
 *     subPropertyOf nif:confidenceCompanion AND itsrdf:taConfidence) --
 *     confidence of the link to a concrete entity, on [0,1].
 *   itsrdfTaIdentProv : prov:Activity | prov:Agent [0..1] (nif:taIdentProv,
 *     ObjectProperty, subPropertyOf nif:provenanceCompanion) -- provenance of
 *     the link to a concrete entity.
 */
export interface INifAnnotation extends IElement {
  readonly annotationUnitId: string | undefined;
  readonly provenanceId: string | undefined;
  readonly itsrdfTaIdentRefId: string | undefined;
  readonly itsrdfTaIdentConf: number | undefined;
  readonly itsrdfTaIdentProvId: string | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONCRETE BASE CLASSES — minimal extensible carriers per
//   /.claude/rules/convention/classes.md ("every class extends a base and
//   implements an interface").
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @standard NIF 2.0 §nif:String — concrete carrier for INifString.
 * Abstract per the spec ("This class is abstract and should not be
 * serialized") — instantiate one of the sub-classes (Context, Word, Phrase,
 * Sentence, Title, Paragraph, OffsetBasedString, ContextHashBasedString)
 * instead.
 */
export abstract class NifString implements INifString {
  readonly ownedCommentIds: ReadonlyArray<string> = [];
  readonly ownedElementIds: ReadonlyArray<string> = [];
  readonly ownerId: string | undefined;
  readonly anchorOf: string | undefined;
  readonly beginIndex: number | undefined;
  readonly endIndex: number | undefined;
  readonly referenceContextId: string | undefined;
  readonly superStringIds: ReadonlyArray<string>;
  readonly subStringIds: ReadonlyArray<string>;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    referenceContextId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
  }) {
    this.ownerId = data.ownerId;
    this.anchorOf = data.anchorOf;
    this.beginIndex = data.beginIndex;
    this.endIndex = data.endIndex;
    this.referenceContextId = data.referenceContextId;
    this.superStringIds = data.superStringIds ?? [];
    this.subStringIds = data.subStringIds ?? [];
  }
  allOwnedElements(): ReadonlyArray<string> { return this.ownedElementIds; }
  mustBeOwned(): boolean { return false; }
  referenceContext(): INifContext | undefined { return undefined; }
  superStrings(): ReadonlyArray<INifString> { return []; }
  subStrings(): ReadonlyArray<INifString> { return []; }
}

/** @standard NIF 2.0 §nif:Context. */
export class NifContext extends NifString implements INifContext {
  readonly isString: string | undefined;
  readonly contextStringRefId: string | undefined;
  readonly sourceUrlId: string | undefined;
  readonly broaderContextIds: ReadonlyArray<string>;
  readonly narrowerContextIds: ReadonlyArray<string>;
  readonly predominantLanguageId: string | undefined;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    isString?: string;
    contextStringRefId?: string;
    sourceUrlId?: string;
    broaderContextIds?: ReadonlyArray<string>;
    narrowerContextIds?: ReadonlyArray<string>;
    predominantLanguageId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
  }) {
    // §Context: a Context's reference context is itself (owl:hasSelf "true").
    super({ ...data, referenceContextId: data.ownerId });
    if ((data.isString === undefined) === (data.contextStringRefId === undefined)) {
      throw new Error(
        'nif.NifContext: exactly one of isString or contextStringRefId must be present (NIF 2.0 §nif:Context owl:unionOf restriction)',
      );
    }
    this.isString = data.isString;
    this.contextStringRefId = data.contextStringRefId;
    this.sourceUrlId = data.sourceUrlId;
    this.broaderContextIds = data.broaderContextIds ?? [];
    this.narrowerContextIds = data.narrowerContextIds ?? [];
    this.predominantLanguageId = data.predominantLanguageId;
  }
  override referenceContext(): INifContext | undefined { return this; }
  broaderContexts(): ReadonlyArray<INifContext> { return []; }
  narrowerContexts(): ReadonlyArray<INifContext> { return []; }
}

/** @standard NIF 2.0 §nif:URIScheme — abstract URI-scheme carrier. */
export abstract class NifUriScheme<
    Kind extends typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry]>
    extends NifString implements INifUriScheme<Kind> {
  readonly schemeKind: IUriSchemeKind<Kind>;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    referenceContextId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    schemeKind: IUriSchemeKind<Kind>;
  }) {
    super(data);
    this.schemeKind = data.schemeKind;
  }
}

/** @standard NIF 2.0 §nif:CString — abstract consecutive-string carrier. */
export abstract class NifCString<
    Kind extends typeof UriSchemeKindRegistry[keyof typeof UriSchemeKindRegistry]>
    extends NifUriScheme<Kind> implements INifCString<Kind> {
  override readonly beginIndex: number;
  override readonly endIndex: number;
  override readonly referenceContextId: string;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex: number;
    endIndex: number;
    referenceContextId: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    schemeKind: IUriSchemeKind<Kind>;
  }) {
    super(data);
    this.beginIndex = data.beginIndex;
    this.endIndex = data.endIndex;
    this.referenceContextId = data.referenceContextId;
  }
}

/** @standard NIF 2.0 §nif:OffsetBasedString. */
export class OffsetBasedString
    extends NifCString<typeof UriSchemeKindRegistry.OffsetBased>
    implements IOffsetBasedString {
  readonly offsetFragment: ICharOffsetFragment;
  readonly oaTextPositionSelectorId: string | undefined;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex: number;
    endIndex: number;
    referenceContextId: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    oaTextPositionSelectorId?: string;
  }) {
    super({
      ...data,
      schemeKind: {
        token: UriSchemeKindRegistry.OffsetBased,
        brand: 'nif.UriSchemeKind' as const,
      },
    });
    this.offsetFragment = CharOffsetFragment.of(data.beginIndex, data.endIndex);
    this.oaTextPositionSelectorId = data.oaTextPositionSelectorId;
  }
}

/** @standard NIF 2.0 §nif:ContextHashBasedString. */
export class ContextHashBasedString
    extends NifUriScheme<typeof UriSchemeKindRegistry.ContextHashBased>
    implements IContextHashBasedString {
  readonly hashFragment: string;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    referenceContextId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    hashFragment: string;
  }) {
    super({
      ...data,
      schemeKind: {
        token: UriSchemeKindRegistry.ContextHashBased,
        brand: 'nif.UriSchemeKind' as const,
      },
    });
    this.hashFragment = data.hashFragment;
  }
}

/** @standard NIF 2.0 §nif:Structure — abstract structural-partition carrier. */
export abstract class NifStructure extends NifString implements INifStructure {
  readonly sentenceId: string | undefined;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    referenceContextId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    sentenceId?: string;
  }) {
    super(data);
    this.sentenceId = data.sentenceId;
  }
  sentence(): ISentence | undefined { return undefined; }
}

/** @standard NIF 2.0 §nif:Word. */
export class Word extends NifStructure implements IWord {
  readonly nextWordId: string | undefined;
  readonly previousWordId: string | undefined;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    referenceContextId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    sentenceId?: string;
    nextWordId?: string;
    previousWordId?: string;
  }) {
    super(data);
    this.nextWordId = data.nextWordId;
    this.previousWordId = data.previousWordId;
  }
  nextWord(): IWord | undefined { return undefined; }
  previousWord(): IWord | undefined { return undefined; }
}

/** @standard NIF 2.0 §nif:Phrase. */
export class Phrase extends NifStructure implements IPhrase {}

/** @standard NIF 2.0 §nif:Sentence. */
export class Sentence extends NifStructure implements ISentence {
  readonly wordIds: ReadonlyArray<string>;
  readonly firstWordId: string | undefined;
  readonly lastWordId: string | undefined;
  readonly nextSentenceId: string | undefined;
  readonly previousSentenceId: string | undefined;
  constructor(data: {
    ownerId?: string;
    anchorOf?: string;
    beginIndex?: number;
    endIndex?: number;
    referenceContextId?: string;
    superStringIds?: ReadonlyArray<string>;
    subStringIds?: ReadonlyArray<string>;
    sentenceId?: string;
    wordIds?: ReadonlyArray<string>;
    firstWordId?: string;
    lastWordId?: string;
    nextSentenceId?: string;
    previousSentenceId?: string;
  }) {
    super(data);
    this.wordIds = data.wordIds ?? [];
    this.firstWordId = data.firstWordId;
    this.lastWordId = data.lastWordId;
    this.nextSentenceId = data.nextSentenceId;
    this.previousSentenceId = data.previousSentenceId;
  }
  words(): ReadonlyArray<IWord> { return []; }
  firstWord(): IWord | undefined { return undefined; }
  lastWord(): IWord | undefined { return undefined; }
  nextSentence(): ISentence | undefined { return undefined; }
  previousSentence(): ISentence | undefined { return undefined; }
}

/** @standard NIF 2.0 §nif:Title. */
export class Title extends NifStructure implements ITitle {}

/** @standard NIF 2.0 §nif:Paragraph. */
export class Paragraph extends NifStructure implements IParagraph {}

/** @standard NIF 2.0 §nif:Annotation. */
export class NifAnnotation implements INifAnnotation {
  readonly ownedCommentIds: ReadonlyArray<string> = [];
  readonly ownedElementIds: ReadonlyArray<string> = [];
  readonly ownerId: string | undefined;
  readonly annotationUnitId: string | undefined;
  readonly provenanceId: string | undefined;
  readonly itsrdfTaIdentRefId: string | undefined;
  readonly itsrdfTaIdentConf: number | undefined;
  readonly itsrdfTaIdentProvId: string | undefined;
  constructor(data: {
    ownerId?: string;
    annotationUnitId?: string;
    provenanceId?: string;
    itsrdfTaIdentRefId?: string;
    itsrdfTaIdentConf?: number;
    itsrdfTaIdentProvId?: string;
  }) {
    if (data.itsrdfTaIdentConf !== undefined &&
        (data.itsrdfTaIdentConf < 0 || data.itsrdfTaIdentConf > 1)) {
      throw new Error(
        `nif.NifAnnotation: itsrdfTaIdentConf must be a decimal in [0,1], got ${data.itsrdfTaIdentConf} (NIF 2.0 §nif:taIdentConf range xsd:decimal, §nif:confidenceCompanion range)`,
      );
    }
    this.ownerId = data.ownerId;
    this.annotationUnitId = data.annotationUnitId;
    this.provenanceId = data.provenanceId;
    this.itsrdfTaIdentRefId = data.itsrdfTaIdentRefId;
    this.itsrdfTaIdentConf = data.itsrdfTaIdentConf;
    this.itsrdfTaIdentProvId = data.itsrdfTaIdentProvId;
  }
  allOwnedElements(): ReadonlyArray<string> { return this.ownedElementIds; }
  mustBeOwned(): boolean { return false; }
}

// ═══════════════════════════════════════════════════════════════════════════
// END OF NIF 2.0 METAMODEL
// ═══════════════════════════════════════════════════════════════════════════
