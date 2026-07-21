import { PrismaClient } from "@prisma/client";
import { ReviewList } from "./ReviewList";

const prisma = new PrismaClient();

export default async function AdminReleasesPage() {
  // Fetch pending releases only (Music Review)
  const pendingReleases = await prisma.release.findMany({
    where: { status: 'PENDING', isImported: false },
    include: { 
      artist: { include: { user: true } }, 
      tracks: true 
    },
    orderBy: { createdAt: 'asc' }
  });

  const serializedReleases = pendingReleases.map(release => ({
    id: release.id,
    title: release.title,
    genre: release.genre,
    language: release.language,
    primaryArtist: release.primaryArtist,
    featuredArtist: release.featuredArtist,
    releaseDate: release.releaseDate.toISOString(),
    coverArtworkUrl: release.coverArtworkUrl,
    status: release.status,
    artistUserId: release.artist.userId,
    artistName: release.artist.user.name || "Artist",
    artistEmail: release.artist.user.email,
    tracks: release.tracks.map(t => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audioUrl,
      composer: t.composer || null,
      producer: t.producer || null,
      lyrics: t.lyrics || null,
      isrc: t.isrc || null,
      upc: t.upc || null,
      tiktokClipStart: t.tiktokClipStart || null,
    }))
  }));

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Music Review</h1>
        <p className="text-gray-500 text-sm">Tinjau rilisan musik baru dari artis sebelum dipublikasikan ke publik.</p>
        <div className="mt-4 bg-yellow-50 text-yellow-700 px-4 py-2.5 rounded-2xl text-xs font-semibold w-max border border-yellow-100">
          ⚠️ {pendingReleases.length} rilisan menunggu persetujuan
        </div>
      </div>

      {pendingReleases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 shadow-sm font-semibold">
          Tidak ada rilisan baru yang perlu ditinjau.
        </div>
      ) : (
        <ReviewList releases={serializedReleases} />
      )}
    </div>
  );
}
