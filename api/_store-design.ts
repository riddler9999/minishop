type ReadResult = {data: unknown; error: unknown};

type BuyerStoreDesignReaders = {
  loadPublished: () => Promise<ReadResult>;
  loadLegacyTheme: () => Promise<ReadResult>;
};

export class PublishedStoreDesignReadError extends Error {
  constructor() {
    super('Published Store Design unavailable');
    this.name = 'PublishedStoreDesignReadError';
  }
}

function publishedDocument(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return (data as {document?: unknown}).document ?? null;
}

function legacyTheme(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return (data as {theme?: unknown}).theme ?? null;
}

export async function loadBuyerStoreDesign(readers: BuyerStoreDesignReaders): Promise<unknown> {
  const published = await readers.loadPublished();
  if (published.error) throw new PublishedStoreDesignReadError();

  const document = publishedDocument(published.data);
  if (document != null) return document;

  const legacy = await readers.loadLegacyTheme();
  if (legacy.error) return null;
  return legacyTheme(legacy.data);
}
