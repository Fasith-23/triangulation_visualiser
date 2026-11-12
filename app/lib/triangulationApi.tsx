import type { CanvasResponse, Point } from "./geometry";

const SESSION_ID_KEY = "triangulation-session-id";

let sessionIdPromise: Promise<string> | null = null;

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function createSession(): Promise<string> {
  const response = await fetch("https://home-python-sdk.onrender.com/triangulation-visualiser/sessions", { method: "POST" });

  if (!response.ok) {
    throw new Error(`Could not create session (${response.status})`);
  }

  const data = (await response.json()) as { session_id: string };
  sessionStorage.setItem(SESSION_ID_KEY, data.session_id);

  return data.session_id;
}

async function getSessionId(): Promise<string> {
  const storedId = sessionStorage.getItem(SESSION_ID_KEY);
  if (storedId) return storedId;

  if (!sessionIdPromise) {
    sessionIdPromise = createSession().finally(() => {
      sessionIdPromise = null;
    });
  }

  return sessionIdPromise;
}

async function fetchSessionState(
  sessionId: string
): Promise<CanvasResponse> {
  const response = await fetch(`https://home-python-sdk.onrender.com/triangulation-visualiser/sessions/${sessionId}`);

  if (!response.ok) {
      throw new ApiError(
        `Could not load session (${response.status})`,
        response.status
      );
    }


  return response.json() as Promise<CanvasResponse>;
}

export async function getSessionState(): Promise<CanvasResponse> {
  const storedId = sessionStorage.getItem(SESSION_ID_KEY);

  if (storedId) {
    try {
      return await fetchSessionState(storedId);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error; // Keep the saved session if this was a network/server error.
      }

      sessionStorage.removeItem(SESSION_ID_KEY);
    }
  }

  await getSessionId(); // Creates and stores a new session.
  return { points: [], lines: [] };
}


async function requestCanvas(
  path: string,
  init: RequestInit
): Promise<CanvasResponse> {
  const sessionId = await getSessionId();
  const response = await fetch(`https://home-python-sdk.onrender.com/triangulation-visualiser/sessions/${sessionId}${path}`, init);

  if (!response.ok) {
      if (response.status === 404) {
        const error = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;

        if (error?.detail === "Session not found or expired") {
          sessionStorage.removeItem(SESSION_ID_KEY);
        }

        throw new Error(error?.detail ?? `Request failed (${response.status})`);
      }

      throw new Error(`Request failed (${response.status})`);
    }


  return response.json() as Promise<CanvasResponse>;
}

export function addPoint(point: Point): Promise<CanvasResponse> {
  return requestCanvas("/points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(point),
  });
}

export function deletePointAt(
  x: number,
  y: number
): Promise<CanvasResponse> {
  const query = new URLSearchParams({ x: String(x), y: String(y) });

  return requestCanvas(`/points?${query.toString()}`, {
    method: "DELETE",
  });
}

export function deleteAllPoints(): Promise<CanvasResponse> {
  return requestCanvas("/points/all", { method: "DELETE" });
}




// export async function getTriangulationLines(
//   points: Point[]
// ): Promise<ProcessedLine[]> {
//   const response = await fetch("https://home-python-sdk.onrender.com/triangulation-visualiser/get-delaunay-edges", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(points),
//   });

//   if (!response.ok) {
//     throw new Error(`Triangulation request failed (${response.status})`);
//   }

//   return response.json() as Promise<ProcessedLine[]>;
// }
