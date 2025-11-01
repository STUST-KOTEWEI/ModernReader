import { useEffect, useState } from "react";

import { sessionClient } from "../services/api";

interface SessionEvent {
  timestamp: string;
  event_type: string;
  emotion: string | null;
}

export const SessionTelemetryPanel = () => {
  const [events, setEvents] = useState<SessionEvent[]>([]);

  useEffect(() => {
    sessionClient
      .listEvents("demo-session")
      .then((response) => setEvents(response.events))
      .catch((error) => console.error(error));
  }, []);

  return (
    <section className="panel">
      <h3>Emotion Telemetry</h3>
      <ul>
        {events.map((event, index) => (
          <li key={`${event.timestamp}-${index}`}>
            <div className="panel-item">
              <strong>{event.event_type}</strong>
              <span>{event.timestamp}</span>
              {event.emotion && <small>Emotion: {event.emotion}</small>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
