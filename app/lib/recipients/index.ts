/**
 * Recipients and address lists for batch cards. Pure functions over plain objects; storage (a `recipient_lists`
 * collection) and API routes come in wave 2 (docs/shop/batch-orders.md).
 */
export * from "./types";
export { addressKey, familyPlural, parseOneLineAddress, suggestHouseholdName, splitNames, usStateCode, normalizeCountry, normalizeZip } from "./normalize";
export { validateRecipient, cleanDraft, toDraft, MAX_NAMES_PER_HOUSEHOLD, MAX_TAGS, cleanTags } from "./validate";
export { newList, renameList, addRecipient, updateRecipient, removeRecipients, buildPreview, commitImport, snapshotRecipients, scrubSnapshot, recipientKey, MAX_LIST_SIZE, MAX_LISTS_PER_USER } from "./list";
export { importCsv, exportCsv, parseCsv, mapHeaders, EXPORT_HEADERS, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, MAX_VCARD_BYTES, MAX_CSV_CELLS, importSizeError } from "./csv";
export { importVCard, parseVCards, MAX_VCARD_LINES, MAX_VCARD_CONTACTS } from "./vcard";
export { formatAddressBlock, formatEnvelope, formatReturnAddress, blockText, type EnvelopeOptions, type EnvelopeStyle, type AddressBlock } from "./envelope";
