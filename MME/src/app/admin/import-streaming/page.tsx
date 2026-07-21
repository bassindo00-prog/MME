import ImportStreamingClient from "./ImportStreamingClient";
import { getImportLogs } from "@/app/actions/importStreaming";

export const metadata = {
  title: "Import Streaming Data | MME Music",
};

export default async function ImportStreamingPage() {
  const logs = await getImportLogs();

  return (
    <div className="p-4 md:p-8">
      <ImportStreamingClient initialLogs={logs} />
    </div>
  );
}
