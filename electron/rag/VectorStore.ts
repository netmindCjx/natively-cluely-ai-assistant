// electron/rag/VectorStore.ts
// Cloud-backed vector storage. Embeddings are computed locally (by EmbeddingPipeline) and
// stored/searched in Supabase pgvector via the backend (CloudClient). Replaces the former
// local sqlite-vec implementation.
//
// The "save chunks → get ids → store embedding by id" contract used by EmbeddingPipeline and
// LiveRAGIndexer is preserved with an in-memory chunk buffer: saveChunks() assigns local ids
// and buffers the chunk text; storeEmbedding() fills the vector and appends that chunk to the
// cloud. Search and existence checks go straight to the backend.

import { Chunk } from './SemanticChunker';
import { CloudClient } from '../services/CloudClient';

export interface StoredChunk extends Chunk {
    id: number;
    embedding?: number[];
}

export interface ScoredChunk extends StoredChunk {
    similarity: number;
    finalScore?: number;
}

interface BufferedChunk extends StoredChunk {
    dim?: number;
}

export class VectorStore {
    private buffer = new Map<number, BufferedChunk>();          // local id -> chunk
    private meetingChunkIds = new Map<string, number[]>();      // meetingId -> local ids
    private summaryText = new Map<string, string>();            // meetingId -> summary text
    private embeddedMeetings = new Set<string>();              // meetings we've stored vectors for this session
    private idCounter = 0;

    private get cloud() {
        return CloudClient.getInstance();
    }

    /** Buffer chunks (no embeddings yet) and return their local ids. Append-only. */
    saveChunks(chunks: Chunk[]): number[] {
        const ids: number[] = [];
        for (const chunk of chunks) {
            const id = ++this.idCounter;
            this.buffer.set(id, { ...chunk, id });
            const list = this.meetingChunkIds.get(chunk.meetingId) ?? [];
            list.push(id);
            this.meetingChunkIds.set(chunk.meetingId, list);
            ids.push(id);
        }
        return ids;
    }

    getChunksWithoutEmbeddings(meetingId: string): StoredChunk[] {
        const ids = this.meetingChunkIds.get(meetingId) ?? [];
        return ids
            .map(id => this.buffer.get(id))
            .filter((c): c is BufferedChunk => !!c && !c.embedding);
    }

    getChunksForMeeting(meetingId: string): StoredChunk[] {
        const ids = this.meetingChunkIds.get(meetingId) ?? [];
        return ids.map(id => this.buffer.get(id)).filter((c): c is BufferedChunk => !!c);
    }

    /** Fill a buffered chunk's embedding and append it to the cloud. */
    async storeEmbedding(chunkId: number, embedding: number[]): Promise<void> {
        const chunk = this.buffer.get(chunkId);
        if (!chunk) {
            console.warn(`[VectorStore] storeEmbedding: chunk ${chunkId} not in buffer`);
            return;
        }
        chunk.embedding = embedding;
        chunk.dim = embedding.length;
        await this.cloud.upsertChunks(chunk.meetingId, [
            {
                chunk_index: chunk.chunkIndex,
                speaker: chunk.speaker,
                start_timestamp_ms: chunk.startMs,
                end_timestamp_ms: chunk.endMs,
                cleaned_text: chunk.text,
                token_count: chunk.tokenCount,
                dim: embedding.length,
                embedding,
            },
        ]);
        this.embeddedMeetings.add(chunk.meetingId);
    }

    saveSummary(meetingId: string, summaryText: string): void {
        this.summaryText.set(meetingId, summaryText);
    }

    /** Returns the buffered summary text for a meeting (used by EmbeddingPipeline). */
    getSummaryText(meetingId: string): string | undefined {
        return this.summaryText.get(meetingId);
    }

    async storeSummaryEmbedding(meetingId: string, embedding: number[]): Promise<void> {
        const text = this.summaryText.get(meetingId);
        if (!text) {
            console.warn(`[VectorStore] storeSummaryEmbedding: no summary text buffered for ${meetingId}`);
            return;
        }
        await this.cloud.upsertSummary(meetingId, text, embedding.length, embedding);
        this.embeddedMeetings.add(meetingId);
    }

    async searchSimilar(
        queryEmbedding: number[],
        options: { meetingId?: string; limit?: number; minSimilarity?: number; providerName?: string } = {},
    ): Promise<ScoredChunk[]> {
        const { meetingId, limit = 8, minSimilarity = 0.25 } = options;
        const rows = await this.cloud.searchChunks({
            embedding: queryEmbedding,
            dim: queryEmbedding.length,
            meeting_id: meetingId ?? null,
            limit,
            min_similarity: minSimilarity,
        });
        return (rows || []).map(r => VectorStore.rowToScored(r));
    }

    async searchSummaries(
        queryEmbedding: number[],
        limit: number = 5,
        _providerName?: string,
    ): Promise<{ meetingId: string; summaryText: string; similarity: number }[]> {
        const rows = await this.cloud.searchSummaries({ embedding: queryEmbedding, dim: queryEmbedding.length, limit });
        return (rows || []).map(r => ({ meetingId: r.meeting_id, summaryText: r.summary_text, similarity: r.similarity }));
    }

    async hasEmbeddings(meetingId: string): Promise<boolean> {
        if (this.embeddedMeetings.has(meetingId)) return true;
        try {
            return await this.cloud.chunksExist(meetingId);
        } catch (e) {
            console.error('[VectorStore] hasEmbeddings check failed:', e);
            return false;
        }
    }

    async deleteChunksForMeeting(meetingId: string): Promise<void> {
        this.clearBuffer(meetingId);
        this.embeddedMeetings.delete(meetingId);
        await this.cloud.deleteEmbeddings(meetingId);
    }

    /** Clear cloud embeddings for a meeting but keep buffered chunks so they can be re-embedded. */
    async clearEmbeddingsForMeeting(meetingId: string): Promise<void> {
        for (const id of this.meetingChunkIds.get(meetingId) ?? []) {
            const c = this.buffer.get(id);
            if (c) c.embedding = undefined;
        }
        this.summaryText.delete(meetingId);
        this.embeddedMeetings.delete(meetingId);
        await this.cloud.deleteEmbeddings(meetingId);
    }

    // Provider-switch re-indexing was a sqlite-era safety net keyed on per-meeting provider
    // metadata. In the cloud MVP each chunk carries its own `dim`, and search filters by dim,
    // so cross-provider results simply don't match. These are no-ops kept for API stability.
    getIncompatibleMeetingsCount(_providerName: string): number {
        return 0;
    }
    deleteEmbeddingsForMeetings(_providerName: string): string[] {
        return [];
    }
    backfillEmbeddingProviderMetadata(_providerName: string, _dimensions: number): number {
        return 0;
    }

    async destroy(): Promise<void> {
        this.buffer.clear();
        this.meetingChunkIds.clear();
        this.summaryText.clear();
        this.embeddedMeetings.clear();
    }

    private clearBuffer(meetingId: string): void {
        for (const id of this.meetingChunkIds.get(meetingId) ?? []) this.buffer.delete(id);
        this.meetingChunkIds.delete(meetingId);
        this.summaryText.delete(meetingId);
    }

    private static rowToScored(r: any): ScoredChunk {
        return {
            id: r.id,
            meetingId: r.meeting_id,
            chunkIndex: r.chunk_index,
            speaker: r.speaker,
            startMs: r.start_timestamp_ms,
            endMs: r.end_timestamp_ms,
            text: r.cleaned_text,
            tokenCount: r.token_count,
            similarity: r.similarity,
        };
    }
}
