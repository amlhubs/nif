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
//   nif.annotation.taidentref.get(a)
//
// Rule enforcement (integrated-team re-export rules):
//   - No vendor-isms exported.
//   - Lowercase identifiers at every depth preserve the dotted-namespace call-site shape.
//   - Concrete classes + interfaces re-exported for tree-shakeable sub-path imports.
//
// IMPLEMENTERS: AFTER inserting metaclass declarations into nif.ts, INSERT
//   matching dotted accessors INTO the `nif` const-object below, and INSERT
//   matching named re-exports INTO the `export { ... }` block at the bottom.

// ─── IMPLEMENTER INSERTION POINT (TYPE IMPORTS) — BEGIN ──────────────────
// Implementers: import every IFoo / Foo declared in nif.ts here.

// import type {
//   IContext,
//   IString,
//   IWord,
//   IPhrase,
//   ISentence,
//   ITitle,
//   IParagraph,
//   IAnnotation,
//   IOffsetBasedString,
//   IContextHashBasedString,
// } from './nif.js'

// ─── IMPLEMENTER INSERTION POINT (TYPE IMPORTS) — END ────────────────────

// ─── nif namespace — frozen lowercase dotted accessors ───
export const nif = {

  // ─── IMPLEMENTER INSERTION POINT (NAMESPACE) — BEGIN ───────────────────
  // Implementers: add per-concept dotted accessors here.

  // ─── IMPLEMENTER INSERTION POINT (NAMESPACE) — END ─────────────────────

} as const;

// ─── Named re-exports — concrete classes (tree-shakeable) ────────────────
// IMPLEMENTERS: insert concrete-class re-exports here.

// export {
//   Context,
//   StringElement,
//   Word,
//   Phrase,
//   Sentence,
//   Title,
//   Paragraph,
//   Annotation,
//   OffsetBasedString,
//   ContextHashBasedString,
// } from './nif.js';

// ─── Interface type re-exports (extendable contracts) ────────────────────
// IMPLEMENTERS: insert interface type re-exports here.

// export type {
//   IContext,
//   IString,
//   IWord,
//   IPhrase,
//   ISentence,
//   ITitle,
//   IParagraph,
//   IAnnotation,
//   IOffsetBasedString,
//   IContextHashBasedString,
// } from './nif.js';
