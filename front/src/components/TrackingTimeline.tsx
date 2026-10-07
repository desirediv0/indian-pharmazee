import { ExternalLink } from "lucide-react";

export interface TrackingActivity {
  date: string | null;
  status: string | null;
  activity: string | null;
  location: string | null;
}

export interface TrackingResult {
  awbCode?: string | null;
  courierName?: string | null;
  currentStatus: string | null;
  trackUrl: string | null;
  etd: string | null;
  activities: TrackingActivity[];
  message: string | null;
}

// Live shipment status + scan history, shared by every courier
export default function TrackingTimeline({ tracking }: { tracking: TrackingResult }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#1F2937]">
          {tracking.currentStatus || "No tracking events yet"}
        </p>
        {tracking.trackUrl && (
          <a
            href={tracking.trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-primary hover:underline"
          >
            <ExternalLink className="mr-1 h-3 w-3" /> Public tracking page
          </a>
        )}
      </div>

      {tracking.etd && (
        <p className="mt-1 text-xs text-[#6B7280]">
          Expected delivery: {tracking.etd}
        </p>
      )}

      {tracking.activities.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {tracking.activities.slice(0, 8).map((activity, index) => (
            <li key={`${activity.date}-${index}`} className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <div>
                <p className="text-xs font-medium text-[#1F2937]">
                  {activity.activity || activity.status}
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  {[activity.date, activity.location].filter(Boolean).join(" • ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[#6B7280]">
          {tracking.message || "The courier has not reported any movement yet."}
        </p>
      )}
    </div>
  );
}
