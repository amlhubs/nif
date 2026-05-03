// @amlhubs/nif — NIF 2.0 (W3C BP-MLOD CG / persistence.uni-leipzig.org)
//
// Frozen lowercase dotted namespace `nif.{concept}.{sub?}.{verb}` so call-sites look like:
//   nif.context.isstring.get(c)
//   nif.string.beginindex.get(s)
//   nif.string.endindex.get(s)
//   nif.string.anchorof.get(s)
//   nif.string.referencecontext.get(s)
//   nif.string.superstring.get(s)
//   nif.string.substring.get(s)
//   nif.word.nextword.get(w)
//   nif.word.previousword.get(w)
//   nif.sentence.nextsentence.get(s)
//   nif.sentence.previoussentence.get(s)
//   nif.sentence.firstword.get(s)
//   nif.sentence.lastword.get(s)
//   nif.annotation.taidentref.get(a)
//   nif.urischeme.kind.get(u)
//
// Rule enforcement (integrated-team re-export rules):
//   - No vendor-isms exported.
//   - Lowercase identifiers at every depth preserve the dotted-namespace call-site shape.
//   - Concrete classes + interfaces re-exported for tree-shakeable sub-path imports.

import type {
  INifString,
  INifContext,
  INifUriScheme,
  INifCString,
  IOffsetBasedString,
  IContextHashBasedString,
  INifStructure,
  IWord,
  ISentence,
  INifAnnotation,
  IUriSchemeKind,
} from './nif.js';

// ─── nif namespace — frozen lowercase dotted accessors ───
export const nif = {

  // ── string (nif:String — abstract base) ─────────────────────────────────
  string: {
    anchorof: {
      get: (s: INifString): string | undefined => s.anchorOf,
    },
    beginindex: {
      get: (s: INifString): number | undefined => s.beginIndex,
    },
    endindex: {
      get: (s: INifString): number | undefined => s.endIndex,
    },
    referencecontext: {
      get: (s: INifString): string | undefined => s.referenceContextId,
    },
    superstring: {
      get: (s: INifString): ReadonlyArray<string> => s.superStringIds,
    },
    substring: {
      get: (s: INifString): ReadonlyArray<string> => s.subStringIds,
    },
  },

  // ── context (nif:Context) ───────────────────────────────────────────────
  context: {
    isstring: {
      get: (c: INifContext): string | undefined => c.isString,
    },
    contextstringref: {
      get: (c: INifContext): string | undefined => c.contextStringRefId,
    },
    sourceurl: {
      get: (c: INifContext): string | undefined => c.sourceUrlId,
    },
    broadercontext: {
      get: (c: INifContext): ReadonlyArray<string> => c.broaderContextIds,
    },
    narrowercontext: {
      get: (c: INifContext): ReadonlyArray<string> => c.narrowerContextIds,
    },
    predlang: {
      get: (c: INifContext): string | undefined => c.predominantLanguageId,
    },
  },

  // ── urischeme (nif:URIScheme — abstract) ────────────────────────────────
  urischeme: {
    kind: {
      get: (u: INifUriScheme): IUriSchemeKind => u.schemeKind,
    },
  },

  // ── cstring (nif:CString — abstract) ────────────────────────────────────
  cstring: {
    beginindex: {
      get: (c: INifCString): number => c.beginIndex,
    },
    endindex: {
      get: (c: INifCString): number => c.endIndex,
    },
    referencecontext: {
      get: (c: INifCString): string => c.referenceContextId,
    },
  },

  // ── offsetbasedstring (nif:OffsetBasedString) ───────────────────────────
  offsetbasedstring: {
    fragment: {
      get: (o: IOffsetBasedString) => o.offsetFragment,
    },
    oatextpositionselector: {
      get: (o: IOffsetBasedString): string | undefined => o.oaTextPositionSelectorId,
    },
  },

  // ── contexthashbasedstring (nif:ContextHashBasedString) ─────────────────
  contexthashbasedstring: {
    hashfragment: {
      get: (c: IContextHashBasedString): string => c.hashFragment,
    },
  },

  // ── structure (nif:Structure — abstract) ────────────────────────────────
  structure: {
    sentence: {
      get: (s: INifStructure): string | undefined => s.sentenceId,
    },
  },

  // ── word (nif:Word) ─────────────────────────────────────────────────────
  word: {
    nextword: {
      get: (w: IWord): string | undefined => w.nextWordId,
    },
    previousword: {
      get: (w: IWord): string | undefined => w.previousWordId,
    },
  },

  // ── sentence (nif:Sentence) ─────────────────────────────────────────────
  sentence: {
    word: {
      get: (s: ISentence): ReadonlyArray<string> => s.wordIds,
    },
    firstword: {
      get: (s: ISentence): string | undefined => s.firstWordId,
    },
    lastword: {
      get: (s: ISentence): string | undefined => s.lastWordId,
    },
    nextsentence: {
      get: (s: ISentence): string | undefined => s.nextSentenceId,
    },
    previoussentence: {
      get: (s: ISentence): string | undefined => s.previousSentenceId,
    },
  },

  // ── annotation (nif:Annotation) ─────────────────────────────────────────
  annotation: {
    annotationunit: {
      get: (a: INifAnnotation): string | undefined => a.annotationUnitId,
    },
    provenance: {
      get: (a: INifAnnotation): string | undefined => a.provenanceId,
    },
    taidentref: {
      get: (a: INifAnnotation): string | undefined => a.itsrdfTaIdentRefId,
    },
    taidentconf: {
      get: (a: INifAnnotation): number | undefined => a.itsrdfTaIdentConf,
    },
    taidentprov: {
      get: (a: INifAnnotation): string | undefined => a.itsrdfTaIdentProvId,
    },
  },

} as const;

// ─── Named re-exports — concrete classes (tree-shakeable) ────────────────
export {
  NifString,
  NifContext,
  NifUriScheme,
  NifCString,
  OffsetBasedString,
  ContextHashBasedString,
  NifStructure,
  Word,
  Phrase,
  Sentence,
  Title,
  Paragraph,
  NifAnnotation,
  CharOffsetFragment,
  UriSchemeKindRegistry,
  NIF_CORE_NAMESPACE_IRI,
  ITS_RDF_NAMESPACE_IRI,
} from './nif.js';

// ─── Interface type re-exports (extendable contracts) ────────────────────
export type {
  INifString,
  INifContext,
  INifUriScheme,
  INifCString,
  IOffsetBasedString,
  IContextHashBasedString,
  INifStructure,
  IWord,
  IPhrase,
  ISentence,
  ITitle,
  IParagraph,
  INifAnnotation,
  IUriSchemeKind,
  ICharOffsetFragment,
} from './nif.js';

// ─── Type-only re-exports for upstream-bridging documentation ────────────
export type {
  UmlPackageRealizationOfContext,
  IMofObject,
} from './nif.js';
